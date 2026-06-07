<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Check if the setting already exists
        $exists = DB::table('settings')->where('key', 'publisher_registration_status')->exists();

        if (!$exists) {
            DB::table('settings')->insert([
                'key'   => 'publisher_registration_status',
                'value' => 'pending',
                'group' => 'registration',
                'label' => 'New Publisher Default Status (active or pending)',
                'type'  => 'string',
            ]);
        }
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'publisher_registration_status')->delete();
    }
};
