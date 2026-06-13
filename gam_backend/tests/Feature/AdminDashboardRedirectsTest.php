<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminDashboardRedirectsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_login_payload_contains_correct_roles_list(): void
    {
        // Create Finance Manager
        $finance = User::create([
            'name'      => 'Finance Test',
            'email'     => 'finance@example.com',
            'password'  => Hash::make('Password123!'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
        $finance->assignRole('Finance Manager');

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'finance@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('user.role', 'admin');
        $response->assertJsonFragment(['roles_list' => ['Finance Manager']]);
    }

    public function test_finance_manager_endpoint_access(): void
    {
        $finance = User::create([
            'name'      => 'Finance Test',
            'email'     => 'finance@example.com',
            'password'  => Hash::make('Password123!'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
        $finance->assignRole('Finance Manager');

        Sanctum::actingAs($finance);

        // Allowed: manage_payouts (Finance Manager has this permission)
        $payoutsResponse = $this->getJson('/api/v1/admin/payouts');
        $payoutsResponse->assertStatus(200);

        // Forbidden: manage_websites (Finance Manager does NOT have this permission)
        $websitesResponse = $this->getJson('/api/v1/admin/websites');
        $websitesResponse->assertStatus(403);
    }

    public function test_adops_manager_endpoint_access(): void
    {
        $adops = User::create([
            'name'      => 'AdOps Test',
            'email'     => 'adops@example.com',
            'password'  => Hash::make('Password123!'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
        $adops->assignRole('Ad Ops Manager');

        Sanctum::actingAs($adops);

        // Allowed: manage_websites
        $websitesResponse = $this->getJson('/api/v1/admin/websites');
        $websitesResponse->assertStatus(200);

        // Forbidden: manage_payouts
        $payoutsResponse = $this->getJson('/api/v1/admin/payouts');
        $payoutsResponse->assertStatus(403);
    }

    public function test_support_agent_endpoint_access(): void
    {
        $support = User::create([
            'name'      => 'Support Test',
            'email'     => 'support@example.com',
            'password'  => Hash::make('Password123!'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
        $support->assignRole('Support Agent');

        Sanctum::actingAs($support);

        // Allowed: manage_tickets
        $ticketsResponse = $this->getJson('/api/v1/admin/tickets');
        $ticketsResponse->assertStatus(200);

        // Forbidden: manage_revenue
        $revenueResponse = $this->getJson('/api/v1/admin/revenue');
        $revenueResponse->assertStatus(403);
    }

    public function test_content_manager_endpoint_access(): void
    {
        $content = User::create([
            'name'      => 'Content Test',
            'email'     => 'content@example.com',
            'password'  => Hash::make('Password123!'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
        $content->assignRole('Content Manager');

        Sanctum::actingAs($content);

        // Allowed: manage_pages
        $pagesResponse = $this->getJson('/api/v1/admin/pages');
        $pagesResponse->assertStatus(200);

        // Forbidden: manage_payouts
        $payoutsResponse = $this->getJson('/api/v1/admin/payouts');
        $payoutsResponse->assertStatus(403);
    }
}
