<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_profile_details(): void
    {
        $user = User::create([
            'name'         => 'Original Admin',
            'email'        => 'admin@example.com',
            'password'     => Hash::make('password123'),
            'role'         => 'admin',
            'is_active'    => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/v1/admin/profile', [
            'name'  => 'Updated Admin',
            'email' => 'newadmin@example.com',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('user.name', 'Updated Admin');
        $response->assertJsonPath('user.email', 'newadmin@example.com');

        // Assert database values updated
        $this->assertDatabaseHas('users', [
            'id'    => $user->id,
            'name'  => 'Updated Admin',
            'email' => 'newadmin@example.com',
        ]);
    }

    public function test_admin_cannot_update_email_to_existing_email(): void
    {
        User::create([
            'name'         => 'Other User',
            'email'        => 'other@example.com',
            'password'     => Hash::make('password123'),
            'role'         => 'publisher',
            'is_active'    => true,
        ]);

        $user = User::create([
            'name'         => 'Original Admin',
            'email'        => 'admin@example.com',
            'password'     => Hash::make('password123'),
            'role'         => 'admin',
            'is_active'    => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/v1/admin/profile', [
            'name'  => 'Updated Admin',
            'email' => 'other@example.com',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_admin_can_change_password_with_correct_current_password(): void
    {
        $user = User::create([
            'name'         => 'Admin User',
            'email'        => 'admin@example.com',
            'password'     => Hash::make('old_password123'),
            'role'         => 'admin',
            'is_active'    => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/v1/admin/change-password', [
            'current_password'          => 'old_password123',
            'new_password'              => 'new_password123',
            'new_password_confirmation' => 'new_password123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Password changed successfully.');

        // Re-fetch user and check password
        $user->refresh();
        $this->assertTrue(Hash::check('new_password123', $user->password));
    }

    public function test_admin_cannot_change_password_with_incorrect_current_password(): void
    {
        $user = User::create([
            'name'         => 'Admin User',
            'email'        => 'admin@example.com',
            'password'     => Hash::make('secret_password'),
            'role'         => 'admin',
            'is_active'    => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/v1/admin/change-password', [
            'current_password'          => 'wrong_password',
            'new_password'              => 'new_secret_pwd',
            'new_password_confirmation' => 'new_secret_pwd',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['current_password']);

        // Password should remain unchanged
        $user->refresh();
        $this->assertTrue(Hash::check('secret_password', $user->password));
    }
}
