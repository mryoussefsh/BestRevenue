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
            [
                'key'   => 'google_client_id',
                'value' => '',
                'group' => 'gam',
                'label' => 'Google OAuth Client ID',
                'type'  => 'string',
            ],
            [
                'key'   => 'google_client_secret',
                'value' => '',
                'group' => 'gam',
                'label' => 'Google OAuth Client Secret',
                'type'  => 'string',
            ],
            [
                'key'   => 'ad_type_preselected_sizes',
                'value' => json_encode([
                    'banner' => ['300x250', '300x600'],
                    'reward' => ['1x1'],
                    'interstitial' => ['320x480', '480x320'],
                    'anchor' => ['Fluid'],
                    'float_top' => ['Fluid'],
                    'float_bottom' => ['Fluid'],
                    'float_fullscreen' => ['1x1'],
                ]),
                'group' => 'gam',
                'label' => 'Preselected Sizes per Ad Type',
                'type'  => 'json',
            ],


            // ── Payment ───────────────────────────────────────
            [
                'key'   => 'payment_methods',
                'value' => json_encode([
                    [
                        'name'     => 'Bank Transfer',
                        'minimum'  => 50.00,
                        'guidance' => 'Please provide Bank Name, Account Name, IBAN/AccountNumber, and BIC/SWIFT code.',
                    ],
                    [
                        'name'     => 'PayPal',
                        'minimum'  => 20.00,
                        'guidance' => 'Please provide your registered PayPal email address.',
                    ],
                    [
                        'name'     => 'Wise',
                        'minimum'  => 30.00,
                        'guidance' => 'Please provide your registered Wise email address or bank transfer details.',
                    ],
                ]),
                'group' => 'payment',
                'label' => 'Available Payment Methods (JSON config)',
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
                'key'   => 'site_description',
                'value' => 'Enterprise-grade multi-account Google Ad Manager revenue sharing and publisher portal.',
                'group' => 'display',
                'label' => 'Website Description',
                'type'  => 'string',
            ],
            [
                'key'   => 'platform_timezone',
                'value' => 'UTC',
                'group' => 'display',
                'label' => 'Platform Default Timezone',
                'type'  => 'string',
            ],
            [
                'key'   => 'site_logo',
                'value' => null,
                'group' => 'display',
                'label' => 'Platform Logo Image URL',
                'type'  => 'string',
            ],
            [
                'key'   => 'site_favicon',
                'value' => null,
                'group' => 'display',
                'label' => 'Platform Favicon URL',
                'type'  => 'string',
            ],
            [
                'key'   => 'og_image',
                'value' => null,
                'group' => 'display',
                'label' => 'OG Image URL (SEO Social Share)',
                'type'  => 'string',
            ],

            // ── SEO ───────────────────────────────────────────
            [
                'key'   => 'meta_title',
                'value' => 'BestRevenue - Publisher Revenue Sharing Platform',
                'group' => 'seo',
                'label' => 'SEO Meta Title',
                'type'  => 'string',
            ],
            [
                'key'   => 'meta_description',
                'value' => 'Monetize your websites with premium ads via Google Ad Manager and track your earnings transparently.',
                'group' => 'seo',
                'label' => 'SEO Meta Description',
                'type'  => 'string',
            ],
            [
                'key'   => 'meta_keywords',
                'value' => 'revenue sharing, publisher, google ad manager, gam sync, impressions, ad units, monetization',
                'group' => 'seo',
                'label' => 'SEO Meta Keywords',
                'type'  => 'string',
            ],

            // ── Registration ──────────────────────────────────────
            [
                'key'   => 'registration_status',
                'value' => 'open',
                'group' => 'registration',
                'label' => 'Publisher Self-Registration Status (open or closed)',
                'type'  => 'string',
            ],
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
            // ── Support ───────────────────────────────────────
            [
                'key'   => 'support_email',
                'value' => 'support@bestrevenue.local',
                'group' => 'support',
                'label' => 'Support Destination & Contact Email',
                'type'  => 'string',
            ],
            [
                'key'   => 'support_telegram',
                'value' => 'https://t.me/bestrevenue_support',
                'group' => 'support',
                'label' => 'Support Telegram Link',
                'type'  => 'string',
            ],
            [
                'key'   => 'support_whatsapp',
                'value' => 'https://wa.me/1234567890',
                'group' => 'support',
                'label' => 'Support WhatsApp Link',
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
