<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = [
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
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                $setting
            );
        }
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('key', ['support_email', 'support_telegram', 'support_whatsapp'])->delete();
    }
};
