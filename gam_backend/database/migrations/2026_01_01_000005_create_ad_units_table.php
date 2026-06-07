<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('website_id')->constrained('websites')->cascadeOnDelete();
            $table->string('gam_ad_unit_name', 500); // Must exactly match GAM (case-insensitive match at sync)
            $table->string('display_name', 255);
            $table->decimal('ratio_override', 5, 4)->nullable(); // [ADMIN ONLY] highest priority
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('website_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_units');
    }
};
