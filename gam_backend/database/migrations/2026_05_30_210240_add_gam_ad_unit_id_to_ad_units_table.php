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
            // Numeric GAM Ad Unit ID — used to filter API reports to only tracked ad units
            $table->string('gam_ad_unit_id')->nullable()->after('gam_ad_unit_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ad_units', function (Blueprint $table) {
            $table->dropColumn('gam_ad_unit_id');
        });
    }
};
