<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $exists = DB::table('settings')->where('key', 'publisher_pending_message')->exists();
        if (!$exists) {
            DB::table('settings')->insert([
                'key'   => 'publisher_pending_message',
                'value' => 'Your registration has been received! Your account is pending admin review. You will be notified once it is approved.',
                'group' => 'registration',
                'label' => 'Pending Registration Message (shown to publisher after sign-up)',
                'type'  => 'string',
            ]);
        }
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'publisher_pending_message')->delete();
    }
};
