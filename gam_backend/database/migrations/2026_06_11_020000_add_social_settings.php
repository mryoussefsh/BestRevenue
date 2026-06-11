<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $settings = [
            [
                'key'   => 'social_facebook',
                'value' => null,
                'group' => 'social',
                'label' => 'Facebook Page Link',
                'type'  => 'string',
            ],
            [
                'key'   => 'social_instagram',
                'value' => null,
                'group' => 'social',
                'label' => 'Instagram Profile Link',
                'type'  => 'string',
            ],
            [
                'key'   => 'social_x',
                'value' => null,
                'group' => 'social',
                'label' => 'X / Twitter Profile Link',
                'type'  => 'string',
            ],
            [
                'key'   => 'social_telegram',
                'value' => null,
                'group' => 'social',
                'label' => 'Telegram Channel Link',
                'type'  => 'string',
            ],
        ];

        foreach ($settings as $setting) {
            $exists = DB::table('settings')->where('key', $setting['key'])->exists();
            if (!$exists) {
                DB::table('settings')->insert($setting);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $keys = [
            'social_facebook',
            'social_instagram',
            'social_x',
            'social_telegram',
        ];

        DB::table('settings')->whereIn('key', $keys)->delete();
    }
};
