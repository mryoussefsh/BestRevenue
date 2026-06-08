<?php

namespace Database\Seeders;

use App\Models\AdUnit;
use App\Models\Publisher;
use App\Models\RevenueRecord;
use App\Models\User;
use App\Models\Website;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MockDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create a Publisher
        $publisherId = Str::uuid()->toString();
        $publisher = Publisher::create([
            'id'            => $publisherId,
            'name'          => 'Demo Publisher',
            'email'         => 'publisher@bestrevenue.local',
            'status'        => 'active',
            'default_ratio' => 0.85, // Publisher gets 85%
            'payment_info'  => ['method' => 'Bank Transfer', 'account' => '1234567890'],
        ]);

        User::create([
            'id'           => Str::uuid()->toString(),
            'name'         => 'Demo Publisher',
            'email'        => 'publisher@bestrevenue.local',
            'password'     => Hash::make('publisher123'),
            'role'         => 'publisher',
            'publisher_id' => $publisherId,
            'is_active'    => true,
        ]);

        // 2. Create a Website
        $websiteId = Str::uuid()->toString();
        $website = Website::create([
            'id'               => $websiteId,
            'publisher_id'     => $publisherId,
            'domain'           => 'demoblog.local',
            'gam_network_code' => '1234567890',
            'is_active'        => true,
        ]);

        // 3. Create an Ad Unit
        $adUnitId = Str::uuid()->toString();
        $adUnit = AdUnit::create([
            'id'               => $adUnitId,
            'website_id'       => $websiteId,
            'gam_ad_unit_name' => 'demoblog_header_728x90',
            'display_name'     => 'Header Banner',
            'is_active'        => true,
        ]);

        // 4. Generate Mock Revenue for the previous month
        $previousMonth = now()->subMonth();
        $daysInMonth = $previousMonth->daysInMonth;

        for ($day = 1; $day <= $daysInMonth; $day++) {
            for ($hour = 0; $hour < 24; $hour += 4) { // Mocking some hours
                $impressions = rand(5000, 20000);
                $grossRevenue = $impressions * (rand(5, 15) / 1000); // e.g., $0.5 to $1.5 CPM
                $publisherEarnings = $grossRevenue * 0.85;

                RevenueRecord::create([
                    'id'                 => Str::uuid()->toString(),
                    'ad_unit_id'         => $adUnitId,
                    'date'               => $previousMonth->copy()->day($day)->format('Y-m-d'),
                    'hour'               => str_pad($hour, 2, '0', STR_PAD_LEFT),
                    'impressions'        => $impressions,
                    'gross_revenue'      => $grossRevenue,
                    'publisher_earnings' => $publisherEarnings,
                    'period_closing_id'  => null,
                ]);
            }
        }

        $this->command->info('Mock data seeded successfully! You can login with publisher@bestrevenue.local / publisher123');
    }
}
