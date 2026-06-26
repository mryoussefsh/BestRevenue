<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds website_id (UUID FK → websites) to all 5 traffic tables.
 *
 * Strategy:
 *   — website_id becomes the primary partition key for all traffic reads/writes.
 *   — publisher_id stays denormalized for fast publisher-level rollup queries (never removed).
 *   — Existing rows (if any) get website_id = NULL; they are historical data from the
 *     old publisher-only design and can be pruned if desired.
 *   — Unique constraints are rebuilt: (website_id, date, …) instead of (publisher_id, date, …)
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. traffic_hourly_stats ───────────────────────────────────────
        try {
            Schema::table('traffic_hourly_stats', function (Blueprint $table) {
                $table->dropUnique('traffic_hourly_unique');
            });
        } catch (\Throwable $e) {}

        Schema::table('traffic_hourly_stats', function (Blueprint $table) {
            $table->uuid('website_id')->nullable()->after('id');

            $table->foreign('website_id')
                  ->references('id')
                  ->on('websites')
                  ->onDelete('cascade');

            // New unique: one row per (website, date, hour, device)
            $table->unique(['website_id', 'date', 'hour', 'device_type'], 'traffic_hourly_web_unique');
            $table->index(['website_id', 'date'], 'traffic_hourly_web_date_idx');
        });

        // ── 2. traffic_daily_stats ────────────────────────────────────────
        try {
            Schema::table('traffic_daily_stats', function (Blueprint $table) {
                $table->dropUnique('traffic_daily_unique');
            });
        } catch (\Throwable $e) {}

        Schema::table('traffic_daily_stats', function (Blueprint $table) {
            $table->uuid('website_id')->nullable()->after('id');

            $table->foreign('website_id')
                  ->references('id')
                  ->on('websites')
                  ->onDelete('cascade');

            $table->unique(['website_id', 'date'], 'traffic_daily_web_unique');
            $table->index(['website_id', 'date'], 'traffic_daily_web_date_idx');
        });

        // ── 3. traffic_baselines ──────────────────────────────────────────
        try {
            Schema::table('traffic_baselines', function (Blueprint $table) {
                $table->dropUnique('traffic_baseline_unique');
            });
        } catch (\Throwable $e) {}

        Schema::table('traffic_baselines', function (Blueprint $table) {
            $table->uuid('website_id')->nullable()->after('id');

            $table->foreign('website_id')
                  ->references('id')
                  ->on('websites')
                  ->onDelete('cascade');

            $table->unique(['website_id', 'day_of_week', 'hour'], 'traffic_baseline_web_unique');
            $table->index('website_id', 'traffic_baseline_web_idx');
        });

        // ── 4. traffic_anomalies ──────────────────────────────────────────
        Schema::table('traffic_anomalies', function (Blueprint $table) {
            $table->uuid('website_id')->nullable()->after('id');
            $table->string('website_domain')->nullable()->after('website_id'); // denormalized for fast display

            $table->foreign('website_id')
                  ->references('id')
                  ->on('websites')
                  ->onDelete('cascade');

            $table->index(['website_id', 'detected_at'], 'traffic_anomaly_web_date_idx');
        });

        // ── 5. traffic_quality_scores ─────────────────────────────────────
        try {
            Schema::table('traffic_quality_scores', function (Blueprint $table) {
                $table->dropUnique('traffic_quality_unique');
            });
        } catch (\Throwable $e) {}

        Schema::table('traffic_quality_scores', function (Blueprint $table) {
            $table->uuid('website_id')->nullable()->after('id');

            $table->foreign('website_id')
                  ->references('id')
                  ->on('websites')
                  ->onDelete('cascade');

            $table->unique(['website_id', 'date'], 'traffic_quality_web_unique');
            $table->index('website_id', 'traffic_quality_web_idx');
        });
    }

    public function down(): void
    {
        Schema::table('traffic_hourly_stats', function (Blueprint $table) {
            $table->dropForeign(['website_id']);
            $table->dropUnique('traffic_hourly_web_unique');
            $table->dropIndex('traffic_hourly_web_date_idx');
            $table->dropColumn('website_id');
            // Restore old unique constraint
            $table->unique(['publisher_id', 'date', 'hour', 'device_type'], 'traffic_hourly_unique');
        });

        Schema::table('traffic_daily_stats', function (Blueprint $table) {
            $table->dropForeign(['website_id']);
            $table->dropUnique('traffic_daily_web_unique');
            $table->dropIndex('traffic_daily_web_date_idx');
            $table->dropColumn('website_id');
            $table->unique(['publisher_id', 'date'], 'traffic_daily_unique');
        });

        Schema::table('traffic_baselines', function (Blueprint $table) {
            $table->dropForeign(['website_id']);
            $table->dropUnique('traffic_baseline_web_unique');
            $table->dropIndex('traffic_baseline_web_idx');
            $table->dropColumn('website_id');
            $table->unique(['publisher_id', 'day_of_week', 'hour'], 'traffic_baseline_unique');
        });

        Schema::table('traffic_anomalies', function (Blueprint $table) {
            $table->dropForeign(['website_id']);
            $table->dropIndex('traffic_anomaly_web_date_idx');
            $table->dropColumn(['website_id', 'website_domain']);
        });

        Schema::table('traffic_quality_scores', function (Blueprint $table) {
            $table->dropForeign(['website_id']);
            $table->dropUnique('traffic_quality_web_unique');
            $table->dropIndex('traffic_quality_web_idx');
            $table->dropColumn('website_id');
            $table->unique(['publisher_id', 'date'], 'traffic_quality_unique');
        });
    }
};

