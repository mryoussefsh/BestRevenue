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
                'key'   => 'company_address',
                'value' => null,
                'group' => 'display',
                'label' => 'Company Physical Address (for email footer, CAN-SPAM compliance)',
                'type'  => 'string',
            ],
            [
                'key'   => 'company_address_ar',
                'value' => null,
                'group' => 'display',
                'label' => 'Company Physical Address (Arabic)',
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
        DB::table('settings')->whereIn('key', ['company_address', 'company_address_ar'])->delete();
    }
};
