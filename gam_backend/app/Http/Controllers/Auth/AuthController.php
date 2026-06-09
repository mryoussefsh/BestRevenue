<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/login
     * Returns a Sanctum token with role embedded in the response.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        // FIX [A-5 / FIX-28]: Per-email rate limiting — 10 attempts per 60 minutes.
        // Prevents brute-force and credential-stuffing attacks without IP blocking
        // (which would affect shared IP environments like corporate proxies).
        $rateLimitKey = 'login:' . strtolower($request->email);
        if (RateLimiter::tooManyAttempts($rateLimitKey, 10)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            return response()->json([
                'message' => 'Too many login attempts for this account. Please try again in ' . ceil($seconds / 60) . ' minute(s).',
            ], 429);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            // Increment attempt counter on failed login (decay: 60 minutes = 3600 seconds)
            RateLimiter::hit($rateLimitKey, 3600);

            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        // FIX [A-5]: Clear rate limit on successful login so legitimate users
        // aren't blocked after recovering their password.
        RateLimiter::clear($rateLimitKey);

        if (! $user->is_active) {
            // Check if publisher is pending (not yet approved) vs suspended
            $isPending = $user->publisher && $user->publisher->status === 'pending';
            $message = $isPending
                ? 'Your account is pending admin review. You will be notified once it is approved.'
                : 'Your account has been suspended. Please contact the administrator.';

            return response()->json(['message' => $message], 403);
        }

        // Revoke all old tokens (single session per user)
        $user->tokens()->delete();

        if ($user->publisher) {
            $user->publisher->update(['last_ip' => $request->ip()]);
        }

        $token = $user->createToken('api-token', ['*'], now()->addMinutes(60))->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'expires_in'   => 60 * 60, // seconds
            'user'         => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'role'         => $user->role,
                'publisher_id' => $user->publisher_id,
                'pending_balance' => $user->publisher ? (float) $user->publisher->pending_balance_adjustment : 0.0,
                'payment_info' => $user->publisher ? $user->publisher->payment_info : null,
                'phone'        => $user->publisher ? $user->publisher->phone : null,
                'telegram'     => $user->publisher ? $user->publisher->telegram : null,
                'country'      => $user->publisher ? $user->publisher->country : null,
            ],
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * GET /api/v1/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id'           => $user->id,
            'name'         => $user->name,
            'email'        => $user->email,
            'role'         => $user->role,
            'publisher_id' => $user->publisher_id,
            'is_active'    => $user->is_active,
            'pending_balance' => $user->publisher ? (float) $user->publisher->pending_balance_adjustment : 0.0,
            'payment_info' => $user->publisher ? $user->publisher->payment_info : null,
            'phone'        => $user->publisher ? $user->publisher->phone : null,
            'telegram'     => $user->publisher ? $user->publisher->telegram : null,
            'country'      => $user->publisher ? $user->publisher->country : null,
        ]);
    }
}
