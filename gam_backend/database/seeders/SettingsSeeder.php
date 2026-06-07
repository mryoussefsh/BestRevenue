<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // ── Payout ────────────────────────────────────────
            [
                'key'   => 'payout_threshold',
                'value' => '50.00',
                'group' => 'payout',
                'label' => 'Minimum Payout Threshold (USD)',
                'type'  => 'string',
            ],
            [
                'key'   => 'payout_day',
                'value' => '1',
                'group' => 'payout',
                'label' => 'Auto Payout Day of Month (1–28)',
                'type'  => 'integer',
            ],
            [
                'key'   => 'close_period_day',
                'value' => '20',
                'group' => 'payout',
                'label' => 'Auto-Close Period Day of Next Month (1–28)',
                'type'  => 'integer',
            ],
            [
                'key'   => 'payout_auto_enabled',
                'value' => 'true',
                'group' => 'payout',
                'label' => 'Enable Automatic Monthly Payout Generation',
                'type'  => 'boolean',
            ],
            [
                'key'   => 'approve_earnings_day',
                'value' => '1',
                'group' => 'payout',
                'label' => 'Approve Earnings Day of Next Month (1–28)',
                'type'  => 'integer',
            ],

            // ── GAM ───────────────────────────────────────────
            [
                'key'   => 'gam_timezone',
                'value' => 'UTC',
                'group' => 'gam',
                'label' => 'GAM Report Timezone',
                'type'  => 'string',
            ],
            [
                'key'   => 'gam_sync_days_back',
                'value' => '3',
                'group' => 'gam',
                'label' => 'GAM Sync — Days to Re-sync Each Run',
                'type'  => 'integer',
            ],
            [
                'key'   => 'gam_sync_frequency',
                'value' => 'hourly',
                'group' => 'gam',
                'label' => 'GAM Sync Frequency (daily, hourly, minutes)',
                'type'  => 'string',
            ],
            [
                'key'   => 'gam_sync_interval',
                'value' => '1',
                'group' => 'gam',
                'label' => 'GAM Sync Interval (Hours or Minutes multiplier)',
                'type'  => 'integer',
            ],


            // ── Payment ───────────────────────────────────────
            [
                'key'   => 'payment_methods',
                'value' => json_encode(['Bank Transfer', 'PayPal', 'Wise']),
                'group' => 'payment',
                'label' => 'Available Payment Methods (JSON array)',
                'type'  => 'json',
            ],

            // ── Display ───────────────────────────────────────
            [
                'key'   => 'default_currency',
                'value' => 'USD',
                'group' => 'display',
                'label' => 'Display Currency',
                'type'  => 'string',
            ],
            [
                'key'   => 'site_name',
                'value' => 'BestRevenue',
                'group' => 'display',
                'label' => 'Platform Name',
                'type'  => 'string',
            ],
            [
                'key'   => 'platform_timezone',
                'value' => 'UTC',
                'group' => 'display',
                'label' => 'Platform Default Timezone',
                'type'  => 'string',
            ],

            // ── Registration ──────────────────────────────────────
            [
                'key'   => 'publisher_registration_status',
                'value' => 'pending',
                'group' => 'registration',
                'label' => 'New Publisher Default Status (active or pending)',
                'type'  => 'string',
            ],
            [
                'key'   => 'publisher_pending_message',
                'value' => 'Your registration has been received! Your account is pending admin review. You will be notified once it is approved.',
                'group' => 'registration',
                'label' => 'Pending Registration Message (shown after sign-up)',
                'type'  => 'string',
            ],
            [
                'key'   => 'publisher_default_ratio',
                'value' => '70',
                'group' => 'registration',
                'label' => 'Default Revenue Ratio % (e.g. 70 for 70%)',
                'type'  => 'string',
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
