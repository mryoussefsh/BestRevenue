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
            $table->string('ad_type', 50)->default('banner')->after('is_active');
            $table->string('ad_subtype', 50)->nullable()->after('ad_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ad_units', function (Blueprint $table) {
            $table->dropColumn(['ad_type', 'ad_subtype']);
        });
    }
};
