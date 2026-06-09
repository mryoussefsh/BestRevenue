<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\RegistrationPendingMail;
use App\Mail\RegistrationActiveMail;
use App\Models\Publisher;
use App\Models\RatioHistory;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Services\AuditLogService;

class RegisterController extends Controller
{
    /**
     * POST /api/v1/auth/register
     * Self-registration for new publishers.
     */
    public function register(Request $request): JsonResponse
    {
        $regStatus = Setting::get('registration_status', 'open');
        if ($regStatus === 'closed') {
            return response()->json([
                'message' => 'Registration is currently closed.',
            ], 422);
        }

        $request->validate([
            'name'     => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/'],
            'email'    => 'required|email|unique:users,email|unique:publishers,email',
            'password' => 'required|string|min:8|confirmed',
            // At least one contact field required (enforced below)
            'phone'    => 'nullable|string|max:50',
            'telegram' => 'nullable|string|max:100',
            'skype'    => 'nullable|string|max:100',
        ], [
            'name.regex' => 'Name must only contain English letters and spaces (no numbers or special characters).'
        ]);

        // Ensure at least one contact field is provided
        if (empty($request->phone) && empty($request->telegram)) {
            return response()->json([
                'message' => 'Please provide at least one contact method (phone or Telegram).',
                'errors'  => [
                    'contact' => ['At least one contact field is required (Phone or Telegram).']
                ],
            ], 422);
        }

        // FIX [R-1]: Do NOT perform IP geolocation synchronously during registration.
        // A slow/down ipinfo.io would block ALL registrations. Instead, store the IP
        // and dispatch a background job to fill in the country later.
        // $country = $this->detectCountry($request->ip());  // ← REMOVED
        $regIp = $request->ip();

        // Get default registration status from settings
        $defaultStatus = Setting::where('key', 'publisher_registration_status')->value('value') ?? 'pending';
        // Normalize: only allow 'active' or 'pending'
        $status = in_array($defaultStatus, ['active', 'pending']) ? $defaultStatus : 'pending';

        DB::beginTransaction();

        try {
            $defaultRatio = Setting::where('key', 'publisher_default_ratio')->value('value') ?? 70;
            $defaultRatio = (float) $defaultRatio / 100;

            // Create Publisher record
            $publisher = Publisher::create([
                'id'            => Str::uuid()->toString(),
                'name'          => $request->name,
                'email'         => $request->email,
                'default_ratio' => $defaultRatio,
                'status'        => $status,
                'phone'         => $request->phone ?? null,
                'telegram'      => $request->telegram ?? null,
                'skype'         => $request->skype ?? null,
                'country'       => null,  // FIX [R-1]: Set async via GeolocatePublisherJob
                'reg_ip'        => $regIp,
                'last_ip'       => $regIp,
            ]);

            // Create User account
            $user = User::create([
                'id'           => Str::uuid()->toString(),
                'name'         => $request->name,
                'email'        => $request->email,
                'password'     => Hash::make($request->password),
                'role'         => 'publisher',
                'publisher_id' => $publisher->id,
                'is_active'    => $status === 'active',
            ]);

            // Log initial ratio history
            RatioHistory::create([
                'id'          => Str::uuid()->toString(),
                'entity_type' => 'publisher',
                'entity_id'   => $publisher->id,
                'old_ratio'   => null,
                'new_ratio'   => $publisher->default_ratio,
                'changed_by'  => $user->id,
                'changed_at'  => now(),
            ]);

            DB::commit();

            // FIX [R-1]: Dispatch async geolocation job AFTER commit
            // so the publisher ID exists in DB before the job runs.
            \App\Jobs\GeolocatePublisherJob::dispatch($publisher->id, $regIp);

            AuditLogService::log('registered', 'Publisher', $publisher->id, null, [
                'name'    => $publisher->name,
                'email'   => $publisher->email,
                'status'  => $status,
                'reg_ip'  => $regIp,
            ]);

            // If active → return token so they can log in immediately
            if ($status === 'active') {
                $token = $user->createToken('api-token', ['*'], now()->addMinutes(60))->plainTextToken;

                try { Mail::to($publisher->email)->send(new RegistrationActiveMail($publisher)); } catch (\Exception $e) {}

                return response()->json([
                    'status'       => 'active',
                    'message'      => 'Registration successful! Welcome to ' . config('app.name') . '.',
                    'access_token' => $token,
                    'token_type'   => 'Bearer',
                    'expires_in'   => 60 * 60,
                    'user'         => [
                        'id'           => $user->id,
                        'name'         => $user->name,
                        'email'        => $user->email,
                        'role'         => $user->role,
                        'publisher_id' => $user->publisher_id,
                        'pending_balance' => 0.0,
                    ],
                ], 201);
            }

            // Pending → just confirm registration
            $pendingMessage = Setting::where('key', 'publisher_pending_message')->value('value')
                ?? 'Your registration has been received! Your account is pending admin review. You will be notified once it is approved.';

            try { Mail::to($publisher->email)->send(new RegistrationPendingMail($publisher)); } catch (\Exception $e) {}

            return response()->json([
                'status'  => 'pending',
                'message' => $pendingMessage,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            // FIX [R-3, SEC-8]: Do NOT expose internal exception messages in API responses.
            // Log internally but return a generic message to the client.
            \Illuminate\Support\Facades\Log::error('Registration failed: ' . $e->getMessage(), [
                'email' => $request->email ?? 'unknown',
                'ip'    => $request->ip(),
            ]);
            return response()->json([
                'message' => 'Registration failed. Please try again later.',
            ], 500);
        }
    }

    /**
     * Detect country code from IP address using free ipinfo.io API.
     *
     * FIX [R-1]: This method is now ONLY used by GeolocatePublisherJob (async).
     * It is NOT called during the registration HTTP request anymore.
     *
     * FIX [R-5]: Expanded private IP range detection to cover all RFC 1918 ranges
     * and carrier-grade NAT (100.64.x/10) as per IANA allocation.
     */
    public static function detectCountry(string $ip): ?string
    {
        // Skip all private/reserved IP ranges
        if (
            $ip === '127.0.0.1' ||
            $ip === '::1' ||
            str_starts_with($ip, '192.168.') ||   // RFC 1918 class C
            str_starts_with($ip, '10.')        ||  // RFC 1918 class A
            str_starts_with($ip, '100.64.')    ||  // RFC 6598 carrier-grade NAT
            preg_match('/^172\.(1[6-9]|2\d|3[01])\./', $ip) // RFC 1918 class B: 172.16.0.0–172.31.255.255
        ) {
            return null;
        }

        try {
            $response = file_get_contents("https://ipinfo.io/{$ip}/country", false, stream_context_create([
                'http' => ['timeout' => 3],
            ]));
            if ($response) {
                return trim($response);
            }
        } catch (\Exception $e) {
            // Silently fail — country is optional
        }

        return null;
    }
}
