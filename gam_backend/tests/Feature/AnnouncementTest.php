<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Announcement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AnnouncementTest extends TestCase
{
    use RefreshDatabase;

    private function createAdminUser(): User
    {
        return User::create([
            'name'      => 'Admin User',
            'email'     => 'admin@example.com',
            'password'  => bcrypt('password123'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
    }

    private function createPublisherUser(): User
    {
        return User::create([
            'name'      => 'Publisher User',
            'email'     => 'publisher@example.com',
            'password'  => bcrypt('password123'),
            'role'      => 'publisher',
            'is_active' => true,
        ]);
    }

    public function test_admin_can_create_announcement_with_style(): void
    {
        $admin = $this->createAdminUser();
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/admin/announcements', [
            'title'        => 'Critical Update',
            'content'      => 'Please update your tags.',
            'type'         => 'banner',
            'style'        => 'danger',
            'priority'     => 10,
            'is_active'    => true,
            'target_type'  => 'all',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.style', 'danger');

        $this->assertDatabaseHas('announcements', [
            'title' => 'Critical Update',
            'style' => 'danger',
        ]);
    }

    public function test_admin_cannot_create_announcement_with_invalid_style(): void
    {
        $admin = $this->createAdminUser();
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/admin/announcements', [
            'title'        => 'Invalid Style Test',
            'content'      => 'Content.',
            'type'         => 'banner',
            'style'        => 'unknown_style',
            'priority'     => 1,
            'is_active'    => true,
            'target_type'  => 'all',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['style']);
    }

    public function test_admin_can_update_announcement_style(): void
    {
        $admin = $this->createAdminUser();
        Sanctum::actingAs($admin);

        $announcement = Announcement::create([
            'id'           => '8d54d90f-3fb3-4874-a6b1-096d499317d6',
            'title'        => 'Old Title',
            'content'      => 'Old content.',
            'type'         => 'banner',
            'style'        => 'info',
            'priority'     => 0,
            'is_active'    => true,
            'target_type'  => 'all',
        ]);

        $response = $this->putJson("/api/v1/admin/announcements/{$announcement->id}", [
            'title'        => 'Updated Title',
            'content'      => 'Old content.',
            'type'         => 'modal',
            'style'        => 'success',
            'priority'     => 5,
            'is_active'    => true,
            'target_type'  => 'all',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.style', 'success');

        $this->assertDatabaseHas('announcements', [
            'id'    => $announcement->id,
            'style' => 'success',
            'type'  => 'modal',
        ]);
    }

    public function test_publisher_can_retrieve_announcements_with_style(): void
    {
        $publisher = $this->createPublisherUser();
        Sanctum::actingAs($publisher);

        Announcement::create([
            'id'           => 'fa136d8d-29eb-4a11-a83d-36a88b50f75b',
            'title'        => 'Publisher Notice',
            'content'      => 'Notice body.',
            'type'         => 'banner',
            'style'        => 'warning',
            'priority'     => 2,
            'is_active'    => true,
            'target_type'  => 'all',
        ]);

        $response = $this->getJson('/api/v1/publisher/announcements');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.style', 'warning');
    }
}
