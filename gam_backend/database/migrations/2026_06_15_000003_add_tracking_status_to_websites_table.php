<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('websites', function (Blueprint $table) {
            $table->string('tracking_status', 20)->default('unknown'); // 'unknown', 'active', 'missing'
            $table->timestamp('tracking_checked_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('websites', function (Blueprint $table) {
            $table->dropColumn(['tracking_status', 'tracking_checked_at']);
        });
    }
};
