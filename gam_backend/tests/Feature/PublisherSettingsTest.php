<?php

namespace Tests\Feature;

use App\Models\Publisher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PublisherSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_publisher_can_update_profile_contact_details(): void
    {
        $publisher = Publisher::create([
            'id'    => (string) \Illuminate\Support\Str::uuid(),
            'name'  => 'Original Publisher Name',
            'email' => 'pub@example.com',
        ]);

        $user = User::create([
            'name'         => 'Original User Name',
            'email'        => 'pub@example.com',
            'password'     => Hash::make('password123'),
            'role'         => 'publisher',
            'publisher_id' => $publisher->id,
            'is_active'    => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/v1/publisher/profile', [
            'name'     => 'New Publisher Name',
            'phone'    => '+15550199',
            'telegram' => '@newhandle',
            'country'  => 'Germany',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('user.name', 'New Publisher Name');
        $response->assertJsonPath('user.phone', '+15550199');
        $response->assertJsonPath('user.telegram', '@newhandle');

        // Assert database values updated
        $this->assertDatabaseHas('publishers', [
            'id'       => $publisher->id,
            'name'     => 'New Publisher Name',
            'phone'    => '+15550199',
            'telegram' => '@newhandle',
            'country'  => 'Germany',
        ]);

        // Assert user table name synced
        $this->assertDatabaseHas('users', [
            'id'   => $user->id,
            'name' => 'New Publisher Name',
        ]);
    }

    public function test_publisher_can_change_password_with_correct_current_password(): void
    {
        $publisher = Publisher::create([
            'id'    => (string) \Illuminate\Support\Str::uuid(),
            'name'  => 'Test Pub',
            'email' => 'pub@example.com',
        ]);

        $user = User::create([
            'name'         => 'Test Pub',
            'email'        => 'pub@example.com',
            'password'     => Hash::make('old_password123'),
            'role'         => 'publisher',
            'publisher_id' => $publisher->id,
            'is_active'    => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/v1/publisher/change-password', [
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

    public function test_publisher_cannot_change_password_with_incorrect_current_password(): void
    {
        $publisher = Publisher::create([
            'id'    => (string) \Illuminate\Support\Str::uuid(),
            'name'  => 'Test Pub',
            'email' => 'pub@example.com',
        ]);

        $user = User::create([
            'name'         => 'Test Pub',
            'email'        => 'pub@example.com',
            'password'     => Hash::make('secret_password'),
            'role'         => 'publisher',
            'publisher_id' => $publisher->id,
            'is_active'    => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->putJson('/api/v1/publisher/change-password', [
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
