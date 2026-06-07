<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $exists = DB::table('settings')->where('key', 'platform_timezone')->exists();
        if (!$exists) {
            DB::table('settings')->insert([
                'key'   => 'platform_timezone',
                'value' => 'UTC',
                'group' => 'display',
                'label' => 'Platform Default Timezone',
                'type'  => 'string',
            ]);
        }
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'platform_timezone')->delete();
    }
};
