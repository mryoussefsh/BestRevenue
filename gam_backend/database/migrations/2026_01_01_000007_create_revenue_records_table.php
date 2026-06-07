<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('revenue_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ad_unit_id')->constrained('ad_units')->cascadeOnDelete();
            $table->date('date');
            $table->tinyInteger('hour'); // 0–23
            $table->char('country', 2)->default('--'); // ISO 3166-1 alpha-2, '--' = unknown
            $table->bigInteger('impressions')->default(0);
            $table->integer('clicks')->default(0);
            $table->decimal('ctr', 8, 6)->default(0); // clicks / impressions
            $table->decimal('gross_revenue', 14, 6)->default(0);     // [ADMIN ONLY]
            $table->decimal('cpm', 10, 4)->default(0);               // [ADMIN ONLY] gross CPM
            $table->decimal('ratio_applied', 5, 4)->default(0);      // [ADMIN ONLY]
            $table->decimal('publisher_earnings', 14, 6)->default(0); // gross × ratio
            $table->decimal('publisher_cpm', 10, 4)->default(0);     // publisher earnings CPM
            $table->uuid('period_closing_id')->nullable();            // set when period is closed
            $table->timestamp('synced_at')->nullable();

            // Safe to re-run sync — unique per (ad_unit, date, hour, country)
            $table->unique(['ad_unit_id', 'date', 'hour', 'country'], 'revenue_unique');

            $table->index(['date', 'country']);
            $table->index('period_closing_id');

            $table->foreign('period_closing_id')->references('id')->on('period_closings')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('revenue_records');
    }
};
