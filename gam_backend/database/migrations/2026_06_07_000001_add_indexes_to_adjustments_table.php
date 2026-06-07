<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FIX [ADJ-Performance / FIX-18]:
 * Add a composite index on (publisher_id, status) to the adjustments table.
 *
 * The Publisher::syncPendingBalance() method runs on every adjustment save/delete:
 *   Adjustment::where('publisher_id', $id)->where('status', 'pending')->sum('amount')
 *
 * Without an index this is a full-table scan on every period close (N publishers × M saves).
 * For 1000 adjustments this adds up to seconds of locked table time per close.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('adjustments', function (Blueprint $table) {
            // Composite index covers both the publisher_id filter and status filter
            // used in syncPendingBalance() and the period close queries.
            $table->index(['publisher_id', 'status'], 'adjustments_publisher_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('adjustments', function (Blueprint $table) {
            $table->dropIndex('adjustments_publisher_status_idx');
        });
    }
};
