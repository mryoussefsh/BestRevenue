<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetMail;
use App\Models\Publisher;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    /**
     * POST /api/v1/auth/forgot-password
     * Generate a reset token and send email.
     */
    public function forgot(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Always return success to prevent email enumeration
        $user = User::where('email', $request->email)->where('role', 'publisher')->first();

        if ($user && $user->publisher) {
            // Delete existing tokens for this email
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            // Create new token
            $token = Str::random(64);
            DB::table('password_reset_tokens')->insert([
                'email'      => $request->email,
                'token'      => Hash::make($token),
                'created_at' => now(),
            ]);

            $resetLink = config('app.frontend_url', 'http://localhost:5173')
                . '/reset-password?token=' . $token
                . '&email=' . urlencode($request->email);

            try {
                Mail::to($request->email)->send(new PasswordResetMail($user->publisher, $resetLink));
            } catch (\Exception $e) {
                // Log but don't reveal failure — still return success
                \Log::error('Password reset email failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'If an account with that email exists, a password reset link has been sent.',
        ]);
    }

    /**
     * POST /api/v1/auth/reset-password
     * Validate token and update password.
     */
    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'email'                 => 'required|email',
            'token'                 => 'required|string',
            'password'              => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record || !Hash::check($request->token, $record->token)) {
            return response()->json(['message' => 'Invalid or expired reset link.'], 422);
        }

        // Token expires after 60 minutes
        if (\Carbon\Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['message' => 'This reset link has expired. Please request a new one.'], 422);
        }

        $user = User::where('email', $request->email)->where('role', 'publisher')->first();
        if (!$user) {
            return response()->json(['message' => 'Account not found.'], 404);
        }

        $user->update(['password' => Hash::make($request->password)]);

        // Delete used token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password updated successfully. You can now log in.']);
    }
}
