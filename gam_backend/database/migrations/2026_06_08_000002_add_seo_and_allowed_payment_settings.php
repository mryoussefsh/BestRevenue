<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = [
            [
                'key'   => 'site_description',
                'value' => 'Enterprise-grade multi-account Google Ad Manager revenue sharing and publisher portal.',
                'group' => 'display',
                'label' => 'Website Description',
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
            [
                'key'   => 'registration_status',
                'value' => 'open',
                'group' => 'registration',
                'label' => 'Publisher Self-Registration Status (open or closed)',
                'type'  => 'string',
            ]
        ];

        foreach ($settings as $setting) {
            $exists = DB::table('settings')->where('key', $setting['key'])->exists();
            if (!$exists) {
                DB::table('settings')->insert($setting);
            }
        }

        // Update payment_methods default structure to support name, minimum, guidance JSON array
        $defaultPaymentMethods = [
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
        ];

        DB::table('settings')->updateOrInsert(
            ['key' => 'payment_methods'],
            [
                'value' => json_encode($defaultPaymentMethods),
                'group' => 'payment',
                'label' => 'Available Payment Methods (JSON config)',
                'type'  => 'json',
            ]
        );
    }

    public function down(): void
    {
        $keys = [
            'site_description',
            'site_logo',
            'site_favicon',
            'og_image',
            'meta_title',
            'meta_description',
            'meta_keywords',
            'registration_status',
        ];

        DB::table('settings')->whereIn('key', $keys)->delete();

        // Restore simple payment methods list
        DB::table('settings')->updateOrInsert(
            ['key' => 'payment_methods'],
            [
                'value' => json_encode(['Bank Transfer', 'PayPal', 'Wise']),
                'group' => 'payment',
                'label' => 'Available Payment Methods (JSON array)',
                'type'  => 'json',
            ]
        );
    }
};
