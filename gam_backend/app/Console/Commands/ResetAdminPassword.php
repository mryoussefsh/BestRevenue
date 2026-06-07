<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

/**
 * FIX [PR-3]: Admin CLI password reset command.
 *
 * Provides a command-line utility to reset any user's password, which is crucial
 * for admin recovery scenarios where no recovery flow is exposed on the web.
 *
 * Usage:
 *   php artisan auth:reset-password user@example.com --password=NewPassword123
 *   php artisan auth:reset-password admin@example.com
 */
class ResetAdminPassword extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'auth:reset-password
        {email : The email address of the user}
        {--password= : Optional new password (will prompt securely if omitted)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset the password for a user/admin account via CLI';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email');
        $password = $this->option('password');

        // Find user
        $user = User::where('email', $email)->first();
        if (!$user) {
            $this->error("User not found with email: {$email}");
            return 1;
        }

        // Prompt if password not provided
        if (empty($password)) {
            $password = $this->secret('Enter new password:');
            if (empty($password)) {
                $this->error('Password cannot be empty.');
                return 1;
            }

            $confirm = $this->secret('Confirm new password:');
            if ($password !== $confirm) {
                $this->error('Passwords do not match.');
                return 1;
            }
        }

        // Validate password strength
        $validator = Validator::make(
            ['password' => $password],
            ['password' => 'required|string|min:8']
        );

        if ($validator->fails()) {
            $this->error('Password validation failed: ' . implode(', ', $validator->errors()->all()));
            return 1;
        }

        // Save password
        $user->password = Hash::make($password);
        $user->save();

        // Clear Sanctum tokens as a security measure
        $user->tokens()->delete();

        $this->info("✓ Password reset successfully for user: {$email}. All active sessions have been terminated.");
        return 0;
    }
}
