<?php

namespace Tests\Feature;

use App\Models\Publisher;
use App\Models\Website;
use App\Models\User;
use App\Models\TrafficHourlyStat;
use App\Models\TrafficDailyStat;
use App\Services\TrafficService;
use App\Jobs\BuildDailyTrafficSummaryJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class TrafficFallbackTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Force Redis to be unavailable so fallback paths are executed
        TrafficService::$forceRedisUnavailable = true;
        Cache::clear();
    }

    protected function tearDown(): void
    {
        TrafficService::$forceRedisUnavailable = false;
        parent::tearDown();
    }

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

    public function test_tracking_fallback_works_without_redis(): void
    {
        // 1. Create a publisher and website
        $publisher = Publisher::create([
            'name' => 'Test Publisher',
            'email' => 'publisher@test.com',
            'status' => 'active',
        ]);

        $website = Website::create([
            'publisher_id' => $publisher->id,
            'domain' => 'testsite.com',
            'is_active' => true,
            'tracking_status' => 'missing',
        ]);

        // 2. Post to track endpoint
        $response = $this->postJson('/api/v1/track', [
            'website_id' => $website->id,
            'referrer' => 'https://www.google.com/search?q=test',
            'screen_width' => 1024,
        ], [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ]);

        $response->assertStatus(204);

        // 3. Verify website tracking status is flipped to active
        $website->refresh();
        $this->assertEquals('active', $website->tracking_status);

        // 4. Verify database entry in traffic_hourly_stats
        $date = now()->format('Y-m-d');
        $hour = (int) now()->format('G');

        $this->assertDatabaseHas('traffic_hourly_stats', [
            'website_id' => $website->id,
            'publisher_id' => $publisher->id,
            'date' => $date,
            'hour' => $hour,
            'device_type' => 'desktop',
            'visits' => 1,
            'unique_visitors' => 1,
            'active_visitors_peak' => 1,
        ]);

        // 5. Simulate another visit from the same session (should increment visits but not unique_visitors)
        $this->postJson('/api/v1/track', [
            'website_id' => $website->id,
            'referrer' => 'https://www.google.com/search?q=test',
            'screen_width' => 1024,
        ], [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ]);

        $this->assertDatabaseHas('traffic_hourly_stats', [
            'website_id' => $website->id,
            'publisher_id' => $publisher->id,
            'date' => $date,
            'hour' => $hour,
            'device_type' => 'desktop',
            'visits' => 2,
            'unique_visitors' => 1,
            'active_visitors_peak' => 1,
        ]);

        // 6. Simulate a visit from a DIFFERENT IP/Session (should increment both unique_visitors and peak active visitors)
        $this->postJson('/api/v1/track', [
            'website_id' => $website->id,
            'referrer' => 'https://www.google.com/search?q=test',
            'screen_width' => 1024,
        ], [
            'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        ]);

        // Note: the UA resolves to mobile, which goes into a different row in traffic_hourly_stats
        $this->assertDatabaseHas('traffic_hourly_stats', [
            'website_id' => $website->id,
            'publisher_id' => $publisher->id,
            'date' => $date,
            'hour' => $hour,
            'device_type' => 'mobile',
            'visits' => 1,
            'unique_visitors' => 1,
            'active_visitors_peak' => 2, // Active visitors is tracked globally for the website, so peak active visitors goes to 2!
        ]);

        // 7. Verify the realtime dashboard endpoint returns correct count for active visitors
        $admin = $this->createAdminUser();
        \Laravel\Sanctum\Sanctum::actingAs($admin);

        $realtimeResponse = $this->getJson('/api/v1/admin/traffic/realtime');
        $realtimeResponse->assertStatus(200);
        $realtimeResponse->assertJsonFragment([
            'website_id' => $website->id,
            'website_domain' => $website->domain,
            'active_visitors' => 2,
            'top_referrer' => 'Google',
        ]);

        // 8. Run BuildDailyTrafficSummaryJob manually to verify daily summaries fallback works
        $job = new BuildDailyTrafficSummaryJob($date);
        $job->handle();

        $this->assertDatabaseHas('traffic_daily_stats', [
            'website_id' => $website->id,
            'publisher_id' => $publisher->id,
            'date' => $date,
            'visits' => 3, // 2 desktop + 1 mobile
            'unique_visitors' => 2,
            'mobile_visits' => 1,
            'desktop_visits' => 2,
            'tablet_visits' => 0,
        ]);

        $dailyStat = TrafficDailyStat::where('website_id', $website->id)->where('date', $date)->first();
        $this->assertNotNull($dailyStat);
        $this->assertNotEmpty($dailyStat->top_referrers);
        $this->assertEquals('Google', $dailyStat->top_referrers[0]['source']);
    }

    public function test_tracking_can_be_disabled_via_settings(): void
    {
        // Set the traffic_tracking_enabled setting to false
        \App\Models\Setting::updateOrCreate(
            ['key' => 'traffic_tracking_enabled'],
            [
                'value' => 'false',
                'group' => 'gam',
                'label' => 'Enable Traffic Tracking System (on/off)',
                'type' => 'boolean',
            ]
        );

        $publisher = Publisher::create([
            'name' => 'Test Publisher',
            'email' => 'publisher@test.com',
            'status' => 'active',
        ]);

        $website = Website::create([
            'publisher_id' => $publisher->id,
            'domain' => 'testsite.com',
            'is_active' => true,
            'tracking_status' => 'missing',
        ]);

        // Post to track endpoint
        $response = $this->postJson('/api/v1/track', [
            'website_id' => $website->id,
            'referrer' => 'https://www.google.com/search?q=test',
            'screen_width' => 1024,
        ], [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ]);

        // Should return 204
        $response->assertStatus(204);

        // Tracking status should NOT be updated to active (remains missing)
        $website->refresh();
        $this->assertEquals('missing', $website->tracking_status);

        // No stats should be recorded in traffic_hourly_stats
        $this->assertDatabaseMissing('traffic_hourly_stats', [
            'website_id' => $website->id,
        ]);
    }
}
