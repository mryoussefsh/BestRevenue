<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GamAccount;
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
    public function index(): JsonResponse
    {
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

        // Unlink websites (FK is nullOnDelete, but we do it explicitly for clarity)
        $account->websites()->update(['gam_account_id' => null]);
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

        // Log to audit log — wrapped so a logging failure never breaks the response
        try {
            AuditLogService::log(
                'trigger_sync',
                'GamAccount',
                null,
                null,
                [
                    'output'         => substr($output, 0, 2000),
                    'filters'        => $request->only(['date_from', 'date_to', 'publisher_id', 'gam_account_id', 'days']),
                ]
            );
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Audit log failed after GAM sync: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'GAM Sync executed successfully.',
            'output'  => $output,
        ]);
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
    private function oauthRedirectUri(): string
    {
        return config('services.google.redirect', 'http://127.0.0.1:8000/api/v1/gam-accounts/oauth/callback');
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
            'services.google.redirect'      => $this->oauthRedirectUri(),
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

            // Check if this Google account is already connected
            $account = GamAccount::where('email', $googleUser->getEmail())->first();

            if ($account) {
                // Update existing account with fresh tokens
                $account->update([
                    'access_token'     => $googleUser->token,
                    'refresh_token'    => $googleUser->refreshToken ?? $account->refresh_token,
                    'token_expires_at' => now()->addSeconds($googleUser->expiresIn ?? 3600),
                    'status'           => 'active',
                ]);
                $message = 'reconnected';
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

            // Redirect back to frontend with success
            return redirect("{$frontendUrl}/admin/gam-accounts?oauth={$message}&account={$account->id}");

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
