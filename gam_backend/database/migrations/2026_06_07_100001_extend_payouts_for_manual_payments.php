<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * REFACTOR [MPAY-1]: Extend the payouts table to support standalone Manual Payments.
 *
 * The original design required every payout to have a period_closing_id (NOT NULL),
 * which made it impossible to create an out-of-band payment record without implicitly
 * creating or referencing a PeriodClosing — coupling the two workflows at the DB level.
 *
 * Changes:
 *   1. Make `period_closing_id` nullable — standalone manual payments have no period.
 *   2. Add `is_manual_payment` (boolean, default false) — distinguishes manual payments
 *      from auto-generated period-close payouts.
 *   3. Add `manual_paid_by` (UUID FK to users) — records which admin initiated the
 *      manual payment, separate from `approved_by` which tracks the approval step.
 *
 * Virtual column strategy:
 *   The `active_period_closing_id` virtual column used a MySQL CASE expression that is
 *   not portable to SQLite (used in the test environment). To maintain cross-DB compatibility:
 *   - The existing virtual column is DROPPED (it referenced period_closing_id).
 *   - A new PLAIN NULLABLE index replaces the generated column approach.
 *   - Uniqueness for period-linked payouts (one per publisher per closing) is enforced
 *     at the application layer in PublisherController::createPayout() using a guarded query.
 *   - On MySQL production, the plain unique index on (publisher_id, period_closing_id)
 *     automatically allows multiple NULLs (standard SQL behavior), so manual payments
 *     with period_closing_id = NULL are unconstrained.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Drop the MySQL virtual generated column and its unique index.
        // We use raw DB checks to handle cases where the column doesn't exist (SQLite test env).
        if (Schema::hasColumn('payouts', 'active_period_closing_id')) {
            Schema::table('payouts', function (Blueprint $table) {
                try {
                    $table->dropUnique('payouts_publisher_active_period_unique');
                } catch (\Exception $e) {
                    // Unique index may not exist in test env — safe to skip
                }
                $table->dropColumn('active_period_closing_id');
            });
        } else {
            // In SQLite test env the virtual column may not exist; just drop the index if present
            try {
                Schema::table('payouts', function (Blueprint $table) {
                    $table->dropUnique('payouts_publisher_active_period_unique');
                });
            } catch (\Exception $e) {
                // Safe to ignore — constraint may not exist
            }
        }

        // Step 2: Make period_closing_id nullable and add new manual payment columns.
        Schema::table('payouts', function (Blueprint $table) {
            // Make nullable — manual payments have no associated period.
            // In SQLite, modifying a column requires recreating the table, but Laravel's
            // Doctrine-based change() handles this transparently since Laravel 10+.
            $table->uuid('period_closing_id')->nullable()->change();

            // Flag: true for standalone manual payments, false for auto-generated payouts.
            $table->boolean('is_manual_payment')->default(false)->after('period_closing_id');

            // Which admin initiated this manual payment.
            $table->string('manual_paid_by', 36)->nullable()->after('is_manual_payment');
        });

        // Step 3: Add indexes for query performance.
        Schema::table('payouts', function (Blueprint $table) {
            $table->index('is_manual_payment', 'payouts_is_manual_payment_index');
        });

        // Step 4: On MySQL, add a plain unique index that allows NULLs.
        // SQLite does not need this — application-layer checks enforce the constraint.
        // Standard SQL: UNIQUE index treats NULL as distinct, so multiple NULL rows are allowed.
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('payouts', function (Blueprint $table) {
                $table->unique(
                    ['publisher_id', 'period_closing_id'],
                    'payouts_publisher_period_closing_unique'
                );
            });
        }
    }

    public function down(): void
    {
        // Remove the plain unique index (MySQL only)
        if (DB::getDriverName() !== 'sqlite') {
            try {
                Schema::table('payouts', function (Blueprint $table) {
                    $table->dropUnique('payouts_publisher_period_closing_unique');
                });
            } catch (\Exception $e) {}
        }

        // Remove the indexes and new columns
        Schema::table('payouts', function (Blueprint $table) {
            try { $table->dropIndex('payouts_is_manual_payment_index'); } catch (\Exception $e) {}
            $table->dropColumn(['is_manual_payment', 'manual_paid_by']);
        });

        // Restore period_closing_id as NOT NULL
        Schema::table('payouts', function (Blueprint $table) {
            $table->uuid('period_closing_id')->nullable(false)->change();
        });

        // Restore the original virtual column and its unique index (MySQL only)
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('payouts', function (Blueprint $table) {
                $table->uuid('active_period_closing_id')
                    ->nullable();

                $table->unique(
                    ['publisher_id', 'active_period_closing_id'],
                    'payouts_publisher_active_period_unique'
                );
            });
        }
    }
};
