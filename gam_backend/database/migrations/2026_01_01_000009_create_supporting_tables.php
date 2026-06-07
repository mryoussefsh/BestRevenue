<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ratio_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('entity_type', ['publisher', 'website', 'ad_unit']);
            $table->uuid('entity_id');
            $table->decimal('old_ratio', 5, 4)->nullable(); // [ADMIN ONLY]
            $table->decimal('new_ratio', 5, 4);             // [ADMIN ONLY]
            $table->uuid('changed_by');                     // user id of admin
            $table->timestamp('changed_at')->useCurrent();

            $table->index(['entity_type', 'entity_id']);
            $table->index('changed_by');
        });

        Schema::create('gam_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('triggered_by', ['scheduler', 'manual'])->default('scheduler');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('finished_at')->nullable();
            $table->enum('status', ['running', 'success', 'partial', 'failed'])->default('running');
            $table->integer('rows_fetched')->default(0);
            $table->integer('rows_matched')->default(0);
            $table->integer('rows_skipped')->default(0);
            $table->integer('rows_locked')->default(0); // skipped because period is closed
            $table->text('error_message')->nullable();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id')->nullable();
            $table->string('action', 100);          // e.g. ratio.changed, payout.approved
            $table->string('entity_type', 100)->nullable();
            $table->uuid('entity_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['entity_type', 'entity_id']);
            $table->index('user_id');
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ratio_history');
        Schema::dropIfExists('gam_sync_logs');
        Schema::dropIfExists('audit_logs');
    }
};
