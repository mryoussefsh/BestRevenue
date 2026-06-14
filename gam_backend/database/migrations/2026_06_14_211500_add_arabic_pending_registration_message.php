<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $exists = DB::table('settings')->where('key', 'publisher_pending_message_ar')->exists();
        if (!$exists) {
            DB::table('settings')->insert([
                'key'   => 'publisher_pending_message_ar',
                'value' => 'تم استلام طلب التسجيل الخاص بك! حسابك تحت المراجعة حالياً، وسيتم إخطارك بمجرد الموافقة عليه.',
                'group' => 'registration',
                'label' => 'Pending Registration Message (Arabic)',
                'type'  => 'string',
            ]);
        }
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'publisher_pending_message_ar')->delete();
    }
};
