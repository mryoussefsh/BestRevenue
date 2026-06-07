<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('publishers', function (Blueprint $table) {
            $table->string('phone', 50)->nullable()->after('email');
            $table->string('telegram', 100)->nullable()->after('phone');
            $table->string('skype', 100)->nullable()->after('telegram');
            $table->string('country', 100)->nullable()->after('skype');
            $table->string('reg_ip', 45)->nullable()->after('country');
            $table->string('last_ip', 45)->nullable()->after('reg_ip');
        });
    }

    public function down(): void
    {
        Schema::table('publishers', function (Blueprint $table) {
            $table->dropColumn(['phone', 'telegram', 'skype', 'country', 'reg_ip', 'last_ip']);
        });
    }
};
