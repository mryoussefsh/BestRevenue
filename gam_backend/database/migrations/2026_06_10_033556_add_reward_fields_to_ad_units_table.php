<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ad_units', function (Blueprint $table) {
            $table->integer('repeat_count')->nullable()->after('ad_subtype');
            $table->integer('delay_between_ads')->nullable()->after('repeat_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ad_units', function (Blueprint $table) {
            $table->dropColumn(['repeat_count', 'delay_between_ads']);
        });
    }
};
