<?php

namespace Tests\Feature;

use App\Models\Adjustment;
use App\Models\PeriodClosing;
use App\Models\Publisher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PublisherAdjustmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_publisher_can_retrieve_only_their_own_adjustments(): void
    {
        // 1. Create two publishers and users
        $publisher1 = Publisher::create([
            'id'            => \Illuminate\Support\Str::uuid()->toString(),
            'name'          => 'Publisher One',
            'email'         => 'pub1@test.com',
            'status'        => 'active',
            'default_ratio' => 0.80,
            'payment_info'  => ['method' => 'Wise', 'account' => 'acc_1'],
        ]);
        $user1 = User::create([
            'id'        => \Illuminate\Support\Str::uuid()->toString(),
            'name'      => 'User One',
            'email'     => 'pub1@test.com',
            'password'  => bcrypt('password'),
            'role'      => 'publisher',
            'is_active' => true,
            'publisher_id' => $publisher1->id,
        ]);

        $publisher2 = Publisher::create([
            'id'            => \Illuminate\Support\Str::uuid()->toString(),
            'name'          => 'Publisher Two',
            'email'         => 'pub2@test.com',
            'status'        => 'active',
            'default_ratio' => 0.80,
            'payment_info'  => ['method' => 'Wise', 'account' => 'acc_2'],
        ]);
        $user2 = User::create([
            'id'        => \Illuminate\Support\Str::uuid()->toString(),
            'name'      => 'User Two',
            'email'     => 'pub2@test.com',
            'password'  => bcrypt('password'),
            'role'      => 'publisher',
            'is_active' => true,
            'publisher_id' => $publisher2->id,
        ]);

        // 2. Create period closing
        $periodClosing = PeriodClosing::create([
            'period_year' => 2026,
            'period_month' => 6,
            'status' => 'closed',
            'closed_at' => now(),
            'total_gross_revenue' => 1000.00,
            'total_publisher_earnings' => 800.00,
            'total_impressions' => 10000,
        ]);

        // 3. Create adjustments
        // A pending adjustment for publisher 1
        $adj1 = Adjustment::create([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'publisher_id' => $publisher1->id,
            'amount' => 50.00,
            'notes' => 'Bonus for good performance',
            'status' => 'pending',
        ]);

        // An applied adjustment for publisher 1
        $adj2 = Adjustment::create([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'publisher_id' => $publisher1->id,
            'amount' => -20.00,
            'notes' => 'IVT deduction',
            'status' => 'applied',
            'period_closing_id' => $periodClosing->id,
        ]);

        // An adjustment for publisher 2 (should not be returned to publisher 1)
        $adj3 = Adjustment::create([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'publisher_id' => $publisher2->id,
            'amount' => 100.00,
            'notes' => 'Publisher 2 adjustment',
            'status' => 'pending',
        ]);

        // 4. Authenticate as Publisher 1
        Sanctum::actingAs($user1, ['*']);

        // 5. Request adjustments list
        $response = $this->getJson('/api/v1/publisher/adjustments');

        // 6. Assertions
        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // Assert order (newest first - adj2 was created after adj1)
        $response->assertJsonPath('data.0.id', $adj2->id)
            ->assertJsonPath('data.0.amount', -20)
            ->assertJsonPath('data.0.notes', 'IVT deduction')
            ->assertJsonPath('data.0.status', 'applied')
            ->assertJsonPath('data.0.period_closing.period_year', 2026)
            ->assertJsonPath('data.0.period_closing.period_month', 6)
            ->assertJsonPath('data.1.id', $adj1->id)
            ->assertJsonPath('data.1.amount', 50)
            ->assertJsonPath('data.1.notes', 'Bonus for good performance')
            ->assertJsonPath('data.1.status', 'pending')
            ->assertJsonPath('data.1.period_closing', null);
    }

    public function test_guest_cannot_retrieve_adjustments(): void
    {
        $response = $this->getJson('/api/v1/publisher/adjustments');
        $response->assertStatus(401);
    }
}
