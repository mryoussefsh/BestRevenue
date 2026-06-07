<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $exists = DB::table('settings')->where('key', 'publisher_default_ratio')->exists();
        if (!$exists) {
            DB::table('settings')->insert([
                'key'         => 'publisher_default_ratio',
                'value'       => '70', // Use percentage since that's easier for admins to understand
                'group'       => 'registration',
                'label'       => 'Default Revenue Ratio % (e.g. 70 for 70%)',
                'type'        => 'string',
            ]);
        }
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'publisher_default_ratio')->delete();
    }
};
