<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GamAccount;
use App\Models\GamAccountSnapshot;
use App\Services\AuditLogService;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GamAccountController extends Controller
{
    // ─── CRUD ─────────────────────────────────────────────────────

    /**
     * GET /api/v1/admin/gam-accounts
     */
    public function index(Request $request): JsonResponse
    {
        if (!$request->user()->can('manage_gam_accounts') && !$request->user()->can('manage_revenue')) {
            abort(403, 'This action is unauthorized.');
        }

        $accounts = GamAccount::withCount('websites')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($a) => $a->toApiArray());

        return response()->json($accounts);
    }

    /**
     * POST /api/v1/admin/gam-accounts
     * For manually adding an account without OAuth (e.g. service account JSON).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|email',
            'network_code' => 'nullable|string|max:50',
            'notes'        => 'nullable|string',
            'ads_txt'      => 'nullable|string',
        ]);

        $account = GamAccount::create([
            'id'           => Str::uuid()->toString(),
            'name'         => $data['name'],
            'email'        => $data['email'],
            'network_code' => $data['network_code'] ?? null,
            'notes'        => $data['notes'] ?? null,
            'ads_txt'      => $data['ads_txt'] ?? null,
            'status'       => 'active',
        ]);

        AuditLogService::log('created', 'GamAccount', $account->id, null, $account->toApiArray());

        return response()->json([
            'message' => 'GAM Account added successfully.',
            'account' => $account->toApiArray(),
        ], 201);
    }

    /**
     * PUT /api/v1/admin/gam-accounts/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $account = GamAccount::findOrFail($id);
        $oldData = $account->toApiArray();

        $data = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'network_code' => 'sometimes|nullable|string|max:50',
            'notes'        => 'sometimes|nullable|string',
            'ads_txt'      => 'sometimes|nullable|string',
            'sync_enabled' => 'sometimes|boolean',
        ]);

        $account->update($data);

        AuditLogService::log('updated', 'GamAccount', $account->id, $oldData, $account->toApiArray());

        return response()->json([
            'message' => 'GAM Account updated.',
            'account' => $account->toApiArray(),
        ]);
    }

    /**
     * DELETE /api/v1/admin/gam-accounts/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $account = GamAccount::findOrFail($id);
        $oldData = $account->toApiArray();

        // Snapshot the account's metadata keyed by email so it can be restored
        // automatically when the same Google account is reconnected via OAuth.
        GamAccountSnapshot::updateOrCreate(
            ['email' => $account->email],
            [
                'name'         => $account->name,
                'network_code' => $account->network_code,
                'ads_txt'      => $account->ads_txt,
                'notes'        => $account->notes,
            ]
        );

        // Stamp the email onto every website before unlinking, so that when the
        // same Google account is reconnected later we can auto-relink them.
        $account->websites()->update([
            'last_gam_account_email' => $account->email,
            'gam_account_id'         => null,
        ]);

        // Bust the website list cache so the link icon disappears immediately
        \App\Models\Website::clearCache();

        $account->delete();

        AuditLogService::log('deleted', 'GamAccount', $id, $oldData, null);

        return response()->json(['message' => 'GAM Account disconnected and deleted.']);
    }

    /**
     * POST /api/v1/admin/gam-accounts/sync
     * Triggers the GAM sync command manually, with optional filters.
     */
    public function triggerSync(Request $request): JsonResponse
    {
        $request->validate([
            'date_from'      => 'nullable|date',
            'date_to'        => 'nullable|date',
            'publisher_id'   => 'nullable|string|exists:publishers,id',
            'gam_account_id' => 'nullable|string|exists:gam_accounts,id',
            'days'           => 'nullable|integer|min:1|max:90',
        ]);

        set_time_limit(300); // GAM sync can take 1-2 minutes to poll Google's servers

        $artisanArgs = ['--manual' => true];

        if ($request->filled('days')) {
            $artisanArgs['--days'] = (int) $request->days;
        }

        if ($request->filled('date_from')) {
            $artisanArgs['--date-from'] = $request->date_from;
        }

        if ($request->filled('date_to')) {
            $artisanArgs['--date-to'] = $request->date_to;
        }

        if ($request->filled('publisher_id')) {
            $artisanArgs['--publisher-id'] = $request->publisher_id;
        }

        if ($request->filled('gam_account_id')) {
            $artisanArgs['--gam-account-id'] = $request->gam_account_id;
        }

        \Illuminate\Support\Facades\Artisan::call('gam:sync', $artisanArgs);
        $output = \Illuminate\Support\Facades\Artisan::output();

        // Read the sync log that was just created to determine actual sync outcome
        $syncLog = \App\Models\GamSyncLog::where('triggered_by', 'manual')
            ->orderBy('started_at', 'desc')
            ->first();

        $syncStatus      = $syncLog?->status ?? 'unknown';
        $syncError       = $syncLog?->error_message;
        $rowsFetched     = $syncLog?->rows_fetched ?? 0;
        $rowsMatched     = $syncLog?->rows_matched ?? 0;

        // Log to audit log — wrapped so a logging failure never breaks the response
        try {
            AuditLogService::log(
                'trigger_sync',
                'GamAccount',
                null,
                null,
                [
                    'status'         => $syncStatus,
                    'rows_fetched'   => $rowsFetched,
                    'rows_matched'   => $rowsMatched,
                    'output'         => substr($output, 0, 2000),
                    'filters'        => $request->only(['date_from', 'date_to', 'publisher_id', 'gam_account_id', 'days']),
                ]
            );
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Audit log failed after GAM sync: ' . $e->getMessage());
        }

        // Return appropriate HTTP status based on actual sync result
        if ($syncStatus === 'failed') {
            $errText = $syncError ?: __('gam.unknown_error');
            return response()->json([
                'message' => __('gam.sync_failed', ['error' => $errText]),
                'status'  => $syncStatus,
                'output'  => $output,
            ], 500);
        }

        if ($syncStatus === 'partial') {
            // Extract a clean user-facing reason from the error message
            $reason = $syncError ? $this->extractSyncErrorReason($syncError) : __('gam.accounts_failed_sync');
            return response()->json([
                'message'       => __('gam.sync_completed_errors', ['reason' => $reason]),
                'status'        => $syncStatus,
                'rows_fetched'  => $rowsFetched,
                'rows_matched'  => $rowsMatched,
                'output'        => $output,
            ], 422);
        }

        return response()->json([
            'message'      => __('gam.sync_completed_success'),
            'status'       => $syncStatus,
            'rows_fetched' => $rowsFetched,
            'rows_matched' => $rowsMatched,
            'output'       => $output,
        ]);
    }

    /**
     * Extract a short, user-friendly reason from a raw sync error message.
     * Avoids exposing raw HTTP responses or internal stack traces to the UI.
     */
    private function extractSyncErrorReason(string $errorMessage): string
    {
        // OAuth / credential issues
        if (str_contains($errorMessage, 'invalid_request') || str_contains($errorMessage, 'client ID')) {
            return __('gam.error_missing_credentials');
        }
        if (str_contains($errorMessage, 'invalid_client')) {
            return __('gam.error_invalid_credentials');
        }
        if (str_contains($errorMessage, 'invalid_grant') || str_contains($errorMessage, 'Token has been expired')) {
            return __('gam.error_token_expired');
        }
        if (str_contains($errorMessage, 'authentication failed') || str_contains($errorMessage, 'unauthorized')) {
            return __('gam.error_auth_failed');
        }
        // Network issues
        if (str_contains($errorMessage, 'cURL error') || str_contains($errorMessage, 'Connection refused')) {
            return __('gam.error_network');
        }
        // Rate limit
        if (str_contains($errorMessage, '429') || str_contains($errorMessage, 'Too Many Requests')) {
            return __('gam.error_rate_limit');
        }
        // Generic fallback — return first 150 chars of the error, sanitized
        return substr(strip_tags($errorMessage), 0, 150);
    }

    /**
     * GET /api/v1/admin/gam-accounts/sync-logs
     * Returns a paginated history of all sync executions.
     */
    public function syncLogs(Request $request): JsonResponse
    {
        $logs = \App\Models\GamSyncLog::orderBy('started_at', 'desc')
            ->limit(50)
            ->get()
            ->map(fn ($log) => [
                'id'            => $log->id,
                'triggered_by'  => $log->triggered_by,
                'status'        => $log->status,
                'started_at'    => $log->started_at,
                'finished_at'   => $log->finished_at,
                'duration_sec'  => $log->finished_at && $log->started_at
                    ? $log->started_at->diffInSeconds($log->finished_at)
                    : null,
                'rows_fetched'  => $log->rows_fetched,
                'rows_matched'  => $log->rows_matched,
                'rows_skipped'  => $log->rows_skipped,
                'rows_locked'   => $log->rows_locked,
                'error_message' => $log->error_message,
            ]);

        return response()->json($logs);
    }

    // ─── OAuth Flow ───────────────────────────────────────────────

    /**
     * FIX [SEC-2]: Build the OAuth redirect URI from config/env, not hardcoded.
     * This reads from GOOGLE_REDIRECT_URI in .env (falls back to the default).
     */
    public static function oauthRedirectUri(): string
    {
        $redirect = config('services.google.redirect');
        if (!empty($redirect) && $redirect !== 'http://127.0.0.1:8000/api/v1/gam-accounts/oauth/callback') {
            return $redirect;
        }

        $appUrl = rtrim(config('app.url'), '/');
        if (!empty($appUrl) && $appUrl !== 'http://localhost') {
            return $appUrl . '/api/v1/gam-accounts/oauth/callback';
        }

        return url('api/v1/gam-accounts/oauth/callback');
    }



    /**
     * FIX [SEC-2]: Apply Google credentials from DB settings at runtime.
     * Called before every OAuth operation to ensure fresh credentials.
     */
    private function configureGoogleCredentials(): void
    {
        config([
            'services.google.client_id'     => Setting::get('google_client_id') ?: config('services.google.client_id'),
            'services.google.client_secret' => Setting::get('google_client_secret') ?: config('services.google.client_secret'),
            'services.google.redirect'      => self::oauthRedirectUri(),
        ]);
    }

    /**
     * GET /api/v1/admin/gam-accounts/oauth/url
     * Returns the Google OAuth consent screen URL for the frontend to redirect to.
     *
     * FIX [SEC-3]: The state parameter is now a cryptographically random token
     * stored in the server-side cache. On callback, we validate the state against
     * the cache entry to prevent OAuth CSRF attacks.
     */
    public function oauthUrl(Request $request): JsonResponse
    {
        // FIX [SEC-2]: Use configurable redirect URI, not hardcoded localhost
        $this->configureGoogleCredentials();

        // FIX [SEC-3]: Generate a cryptographically random nonce, store it in cache
        // with a 10-minute TTL. The callback will validate this before proceeding.
        $nonce = Str::random(40);
        $statePayload = [
            'user_id' => $request->user()->id,
            'nonce'   => $nonce,
        ];
        $stateToken = base64_encode(json_encode($statePayload));

        // Store nonce in cache keyed by the token itself (15-min TTL — longer than OAuth timeout)
        Cache::put("oauth_state_{$nonce}", $statePayload, 900);

        $url = Socialite::driver('google')
            ->stateless()
            ->with([
                'access_type' => 'offline',   // Required to get refresh_token
                'prompt'      => 'consent',    // Force consent so refresh_token is always returned
                'state'       => $stateToken,
            ])
            ->scopes([
                'https://www.googleapis.com/auth/admanager',
                'openid',
                'email',
                'profile',
            ])
            ->redirect()->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    /**
     * GET /api/v1/gam-accounts/oauth/callback
     * Google calls this after the admin approves access.
     * Saves tokens and redirects back to the React frontend.
     *
     * FIX [SEC-3]: Validates the state parameter against the server-side cache
     * to prevent CSRF attacks. If the state is missing, invalid, or expired,
     * the callback is rejected.
     *
     * FIX [SEC-2]: Uses configurable redirect URI from env/settings.
     */
    public function oauthCallback(Request $request)
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        // FIX [SEC-2]: Use configurable redirect URI
        $this->configureGoogleCredentials();

        // FIX [SEC-3]: Validate the OAuth state parameter to prevent CSRF
        $stateToken = $request->query('state');
        if (!$stateToken) {
            Log::warning('OAuth callback: missing state parameter');
            return redirect("{$frontendUrl}/admin/gam-accounts?oauth=error&message=" . urlencode('Missing OAuth state parameter. Possible CSRF attack.'));
        }

        $decoded = json_decode(base64_decode($stateToken), true);
        if (!$decoded || empty($decoded['nonce'])) {
            Log::warning('OAuth callback: malformed state parameter');
            return redirect("{$frontendUrl}/admin/gam-accounts?oauth=error&message=" . urlencode('Malformed OAuth state parameter.'));
        }

        $nonce = $decoded['nonce'];
        $cachedState = Cache::get("oauth_state_{$nonce}");

        if (!$cachedState) {
            Log::warning('OAuth callback: state expired or not found', ['nonce' => $nonce]);
            return redirect("{$frontendUrl}/admin/gam-accounts?oauth=error&message=" . urlencode('OAuth state expired or invalid. Please try connecting again.'));
        }

        // Validate that the user_id in the state matches (extra protection)
        if (!isset($decoded['user_id']) || !isset($cachedState['user_id'])) {
            Log::warning('OAuth callback: state missing user_id');
            return redirect("{$frontendUrl}/admin/gam-accounts?oauth=error&message=" . urlencode('Invalid OAuth state structure.'));
        }

        if ($decoded['user_id'] !== $cachedState['user_id']) {
            Log::warning('OAuth callback: state user_id mismatch');
            return redirect("{$frontendUrl}/admin/gam-accounts?oauth=error&message=" . urlencode('OAuth state user mismatch.'));
        }

        // Consume the nonce (delete from cache — one-time use)
        Cache::forget("oauth_state_{$nonce}");

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            // Temporarily authenticate the user so the audit log captures their details
            $userIdToLog = $cachedState['user_id'] ?? null;
            if ($userIdToLog) {
                \Illuminate\Support\Facades\Auth::loginUsingId($userIdToLog);
            }

            // Check if this Google account is already connected
            $account = GamAccount::where('email', $googleUser->getEmail())->first();

            if ($account) {
                $oldData = $account->toApiArray();
                // Update existing account with fresh tokens
                $account->update([
                    'access_token'     => $googleUser->token,
                    'refresh_token'    => $googleUser->refreshToken ?? $account->refresh_token,
                    'token_expires_at' => now()->addSeconds($googleUser->expiresIn ?? 3600),
                    'status'           => 'active',
                ]);
                $message = 'reconnected';
                AuditLogService::log('connected', 'GamAccount', $account->id, $oldData, $account->toApiArray());
            } else {
                // Create new account
                $account = GamAccount::create([
                    'id'               => Str::uuid()->toString(),
                    'name'             => $googleUser->getName() ?: $googleUser->getEmail(),
                    'email'            => $googleUser->getEmail(),
                    'access_token'     => $googleUser->token,
                    'refresh_token'    => $googleUser->refreshToken,
                    'token_expires_at' => now()->addSeconds($googleUser->expiresIn ?? 3600),
                    'status'           => 'active',
                ]);
                $message = 'connected';
                AuditLogService::log('connected', 'GamAccount', $account->id, null, $account->toApiArray());
            }

            // ─── Restore metadata from snapshot ───────────────────────────────
            // A snapshot is saved whenever an account is deleted. On reconnect we
            // restore it. We only restore for a freshly created account ('connected'),
            // not for a simple token refresh ('reconnected') where the existing account
            // already has all its data intact.
            $snapshot = GamAccountSnapshot::find($account->email);
            if ($snapshot) {
                if ($message === 'connected') {
                    // Brand-new account after deletion — restore everything from snapshot
                    $restore = [];
                    if ($snapshot->name)         $restore['name']         = $snapshot->name;
                    if ($snapshot->network_code) $restore['network_code'] = $snapshot->network_code;
                    if ($snapshot->ads_txt)      $restore['ads_txt']      = $snapshot->ads_txt;
                    if ($snapshot->notes)        $restore['notes']        = $snapshot->notes;
                    if ($restore) {
                        $account->update($restore);
                    }
                }
                // Consume the snapshot — it has served its purpose
                $snapshot->delete();
            }

            // ─── Auto-relink previously linked websites ──────────────────────
            // After a GAM account is deleted, websites keep their gam_network_code
            // and last_gam_account_email. On reconnect we use those to find and
            // re-link them automatically without any manual admin work.
            $relinkQuery = \App\Models\Website::whereNull('gam_account_id')
                ->where(function ($q) use ($account) {
                    // Primary: match by GAM network code (globally unique, now restored from snapshot)
                    if ($account->network_code) {
                        $q->where('gam_network_code', $account->network_code);
                    }
                    // Fallback: match by the stamped email from the last linked account
                    $q->orWhere('last_gam_account_email', $account->email);
                });

            $relinkedCount = $relinkQuery->count();

            if ($relinkedCount > 0) {
                $relinkQuery->update(['gam_account_id' => $account->id]);

                AuditLogService::log(
                    'relinked_websites',
                    'GamAccount',
                    $account->id,
                    null,
                    ['relinked_websites_count' => $relinkedCount]
                );

                \App\Models\Website::clearCache();
            }

            // Redirect back to frontend with success
            return redirect("{$frontendUrl}/admin/gam-accounts?oauth={$message}&account={$account->id}&relinked={$relinkedCount}");

        } catch (\Exception $e) {
            // FIX [SEC-8]: Log the full exception internally but redirect with a generic
            // user-facing message. $e->getMessage() can expose GAM API internals, network
            // details, and internal structure to the browser history and server access logs.
            Log::error('GAM OAuth callback failed: ' . $e->getMessage(), [
                'exception' => $e->getTraceAsString(),
            ]);
            return redirect("{$frontendUrl}/admin/gam-accounts?oauth=error&message=" . urlencode('Authentication failed. Please try again.'));
        }
    }

    /**
     * POST /api/v1/admin/gam-accounts/{id}/refresh-token
     * Attempt to refresh an expired token using the stored refresh_token.
     */
    public function refreshToken(string $id): JsonResponse
    {
        $account = GamAccount::findOrFail($id);

        if (!$account->refresh_token) {
            return response()->json(['message' => 'No refresh token stored. Please reconnect via Google OAuth.'], 400);
        }

        try {
            $client = new \GuzzleHttp\Client();
            $response = $client->post('https://oauth2.googleapis.com/token', [
                'form_params' => [
                    'client_id'     => Setting::get('google_client_id') ?: config('services.google.client_id'),
                    'client_secret' => Setting::get('google_client_secret') ?: config('services.google.client_secret'),
                    'refresh_token' => $account->refresh_token,
                    'grant_type'    => 'refresh_token',
                ],
            ]);

            $tokens = json_decode($response->getBody()->getContents(), true);

            $account->update([
                'access_token'     => $tokens['access_token'],
                'token_expires_at' => now()->addSeconds($tokens['expires_in'] ?? 3600),
                'status'           => 'active',
            ]);

            return response()->json(['message' => 'Token refreshed successfully.', 'account' => $account->toApiArray()]);

        } catch (\Exception $e) {
            $account->update(['status' => 'expired']);
            // FIX [NEW-07]: Log the full exception internally; return a generic message externally.
            // $e->getMessage() can contain Google OAuth error codes, network details, or API secrets.
            \Illuminate\Support\Facades\Log::error('GAM token refresh failed for account ' . $account->id . ': ' . $e->getMessage());
            return response()->json(['message' => 'Token refresh failed. Please reconnect the account via Google OAuth.'], 500);
        }
    }
}
