<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FIX [PAY-1]: Restore the unique constraint on payouts but dynamically exclude rejected payouts.
 *
 * This ensures that a publisher can only have at most ONE active (pending, approved, paid)
 * payout per period closing, preventing race conditions that generate duplicate payouts,
 * while still allowing multiple rejected payouts to remain in the database for history/audit.
 *
 * To achieve this in a database-agnostic way, we define a virtual/generated column
 * `active_period_closing_id` that resolves to `period_closing_id` when the status is not 'rejected',
 * and NULL otherwise. We then place a unique index on `(publisher_id, active_period_closing_id)`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payouts', function (Blueprint $table) {
            $table->uuid('active_period_closing_id')
                ->nullable()
                ->virtualAs("CASE WHEN status != 'rejected' THEN period_closing_id ELSE NULL END");

            $table->unique(['publisher_id', 'active_period_closing_id'], 'payouts_publisher_active_period_unique');
        });
    }

    public function down(): void
    {
        Schema::table('payouts', function (Blueprint $table) {
            $table->dropUnique('payouts_publisher_active_period_unique');
            $table->dropColumn('active_period_closing_id');
        });
    }
};

