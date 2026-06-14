<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = [
            [
                'key'   => 'site_name_ar',
                'value' => 'بست ريفينيو',
                'group' => 'display',
                'label' => 'Platform Name (Arabic)',
                'type'  => 'string',
            ],
            [
                'key'   => 'site_description_ar',
                'value' => 'بوابة الناشرين ومشاركة إيرادات إعلانات جوجل مانيجر على مستوى المؤسسات.',
                'group' => 'display',
                'label' => 'Website Description (Arabic)',
                'type'  => 'string',
            ],
            [
                'key'   => 'meta_title_ar',
                'value' => 'BestRevenue - منصة مشاركة أرباح الناشرين',
                'group' => 'seo',
                'label' => 'SEO Meta Title (Arabic)',
                'type'  => 'string',
            ],
            [
                'key'   => 'meta_description_ar',
                'value' => 'حقق أرباحاً من مواقعك الإلكترونية باستخدام إعلانات مميزة عبر Google Ad Manager وتتبع أرباحك بشفافية.',
                'group' => 'seo',
                'label' => 'SEO Meta Description (Arabic)',
                'type'  => 'string',
            ],
            [
                'key'   => 'meta_keywords_ar',
                'value' => 'مشاركة الأرباح، الناشر، مدير إعلانات جوجل، مزامنة GAM، الانطباعات، الوحدات الإعلانية، تحقيق الأرباح',
                'group' => 'seo',
                'label' => 'SEO Meta Keywords (Arabic)',
                'type'  => 'string',
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                $setting
            );
        }
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'site_name_ar',
            'site_description_ar',
            'meta_title_ar',
            'meta_description_ar',
            'meta_keywords_ar',
        ])->delete();
    }
};
