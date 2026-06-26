<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. traffic_hourly_stats ───────────────────────────────────────
        Schema::create('traffic_hourly_stats', function (Blueprint $table) {
            $table->id();
            $table->uuid('publisher_id');
            $table->date('date');
            $table->tinyInteger('hour')->unsigned(); // 0–23
            $table->enum('device_type', ['mobile', 'desktop', 'tablet']);
            $table->unsignedInteger('visits')->default(0);
            $table->unsignedInteger('unique_visitors')->default(0);
            $table->unsignedSmallInteger('active_visitors_peak')->default(0);
            $table->timestamps();

            $table->unique(['publisher_id', 'date', 'hour', 'device_type'], 'traffic_hourly_unique');
            $table->index(['publisher_id', 'date']);
            $table->index(['date', 'hour']);

            $table->foreign('publisher_id')
                  ->references('id')
                  ->on('publishers')
                  ->onDelete('cascade');
        });

        // ── 2. traffic_daily_stats ────────────────────────────────────────
        Schema::create('traffic_daily_stats', function (Blueprint $table) {
            $table->id();
            $table->uuid('publisher_id');
            $table->date('date');
            $table->unsignedInteger('visits')->default(0);
            $table->unsignedInteger('unique_visitors')->default(0);
            $table->unsignedInteger('mobile_visits')->default(0);
            $table->unsignedInteger('desktop_visits')->default(0);
            $table->unsignedInteger('tablet_visits')->default(0);
            $table->json('top_countries')->nullable(); // [{"code":"EG","visits":1200}, ...] top 10
            $table->json('top_referrers')->nullable(); // [{"source":"Google","visits":800}, ...] top 6
            $table->json('top_browsers')->nullable();  // [{"browser":"Chrome","visits":600}, ...]
            $table->unsignedSmallInteger('countries_count')->default(0);
            $table->timestamps();

            $table->unique(['publisher_id', 'date'], 'traffic_daily_unique');
            $table->index(['publisher_id', 'date']);
            $table->index('date');

            $table->foreign('publisher_id')
                  ->references('id')
                  ->on('publishers')
                  ->onDelete('cascade');
        });

        // ── 3. traffic_baselines ──────────────────────────────────────────
        Schema::create('traffic_baselines', function (Blueprint $table) {
            $table->id();
            $table->uuid('publisher_id');
            $table->tinyInteger('day_of_week')->unsigned(); // 0=Sunday … 6=Saturday
            $table->tinyInteger('hour')->unsigned();        // 0–23
            $table->decimal('avg_visits', 10, 2)->default(0);
            $table->decimal('avg_unique_visitors', 10, 2)->default(0);
            $table->char('top_country_code', 2)->nullable();           // dominant country under normal
            $table->decimal('normal_country_concentration', 5, 2)->default(0); // e.g. 65.00 = 65%
            $table->tinyInteger('sample_weeks')->unsigned()->default(0); // weeks of data used
            $table->timestamp('last_calculated_at')->nullable();
            $table->timestamps();

            $table->unique(['publisher_id', 'day_of_week', 'hour'], 'traffic_baseline_unique');
            $table->index('publisher_id');

            $table->foreign('publisher_id')
                  ->references('id')
                  ->on('publishers')
                  ->onDelete('cascade');
        });

        // ── 4. traffic_anomalies ──────────────────────────────────────────
        Schema::create('traffic_anomalies', function (Blueprint $table) {
            $table->id();
            $table->uuid('publisher_id');
            $table->timestamp('detected_at');
            $table->enum('anomaly_type', [
                'volume_spike',
                'volume_drop',
                'country_flood',
                'referrer_flood',
                'device_anomaly',
                'new_country_spike',
            ]);
            $table->enum('severity', ['low', 'medium', 'high', 'critical']);
            $table->string('metric_name');          // e.g. "visits", "country:EG", "referrer:Direct"
            $table->decimal('baseline_value', 10, 2)->default(0);
            $table->decimal('current_value', 10, 2)->default(0);
            $table->decimal('deviation_pct', 10, 2)->default(0); // e.g. 900.00 = 9× baseline
            $table->json('context')->nullable();                  // snapshot at time of detection
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->text('admin_notes')->nullable();
            $table->boolean('notification_sent')->default(false);
            $table->timestamps();

            $table->index(['publisher_id', 'detected_at']);
            $table->index(['severity', 'is_resolved']);
            $table->index('detected_at');

            $table->foreign('publisher_id')
                  ->references('id')
                  ->on('publishers')
                  ->onDelete('cascade');
        });

        // ── 5. traffic_quality_scores ─────────────────────────────────────
        Schema::create('traffic_quality_scores', function (Blueprint $table) {
            $table->id();
            $table->uuid('publisher_id');
            $table->date('date');
            $table->decimal('quality_score', 5, 2)->default(100);       // 0–100 composite
            $table->tinyInteger('anomaly_count')->unsigned()->default(0);
            $table->tinyInteger('high_severity_anomalies')->unsigned()->default(0);
            $table->decimal('dominant_country_pct', 5, 2)->default(0);
            $table->decimal('referrer_diversity_score', 5, 2)->default(0);
            $table->decimal('device_diversity_score', 5, 2)->default(0);
            $table->json('flags')->nullable(); // ["country_flood", "volume_spike"]
            $table->timestamps();

            $table->unique(['publisher_id', 'date'], 'traffic_quality_unique');
            $table->index('publisher_id');
            $table->index('date');

            $table->foreign('publisher_id')
                  ->references('id')
                  ->on('publishers')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('traffic_quality_scores');
        Schema::dropIfExists('traffic_anomalies');
        Schema::dropIfExists('traffic_baselines');
        Schema::dropIfExists('traffic_daily_stats');
        Schema::dropIfExists('traffic_hourly_stats');
    }
};
