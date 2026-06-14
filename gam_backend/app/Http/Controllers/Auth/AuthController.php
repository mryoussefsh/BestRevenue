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
            'remember' => 'nullable|boolean',
        ]);

        // FIX [A-5 / FIX-28]: Per-email rate limiting — 10 attempts per 60 minutes.
        // Prevents brute-force and credential-stuffing attacks without IP blocking
        // (which would affect shared IP environments like corporate proxies).
        $rateLimitKey = 'login:' . strtolower($request->email);
        if (RateLimiter::tooManyAttempts($rateLimitKey, 10)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            return response()->json([
                'message' => __('auth.too_many_attempts_email', ['minutes' => ceil($seconds / 60)]),
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
                ? __('auth.account_pending')
                : __('auth.account_suspended');

            return response()->json(['message' => $message], 403);
        }

        // Revoke all old tokens (single session per user)
        $user->tokens()->delete();

        if ($user->publisher) {
            $user->publisher->update(['last_ip' => $request->ip()]);
        }

        $remember = (bool) $request->input('remember', false);
        $expiration = $remember ? now()->addDays(7) : now()->addMinutes(60);
        $token = $user->createToken('api-token', ['*'], $expiration)->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'expires_in'   => $remember ? 7 * 24 * 60 * 60 : 60 * 60, // seconds
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
                'roles_list'       => $user->roles_list,
                'permissions_list' => $user->permissions_list,
            ],
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => __('auth.logged_out')]);
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
            'roles_list'       => $user->roles_list,
            'permissions_list' => $user->permissions_list,
        ]);
    }
}
