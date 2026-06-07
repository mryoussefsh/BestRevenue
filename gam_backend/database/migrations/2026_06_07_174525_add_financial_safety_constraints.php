<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add idempotency_key to payouts table if it does not exist, and set up the foreign key for manual_paid_by
        if (!Schema::hasColumn('payouts', 'idempotency_key')) {
            Schema::table('payouts', function (Blueprint $table) {
                $table->string('idempotency_key', 64)->nullable()->unique()->after('status');
            });
        }

        Schema::table('payouts', function (Blueprint $table) {
            $table->foreign('manual_paid_by', 'fk_payouts_manual_paid_by')->references('id')->on('users')->nullOnDelete();
        });

        // 2. Add composite index on revenue_records(period_closing_id, date) to optimize period close scanning
        Schema::table('revenue_records', function (Blueprint $table) {
            $table->index(['period_closing_id', 'date'], 'revenue_records_closing_date_index');
        });

        // 3. MySQL-only CHECK constraints for numerical validation
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE payouts ADD CONSTRAINT chk_payouts_final_amount CHECK (final_amount >= 0)');
            DB::statement('ALTER TABLE payouts ADD CONSTRAINT chk_payouts_amount CHECK (amount >= 0)');
            DB::statement('ALTER TABLE adjustments ADD CONSTRAINT chk_adjustments_amount CHECK (amount != 0)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            try {
                DB::statement('ALTER TABLE payouts DROP CONSTRAINT chk_payouts_final_amount');
            } catch (\Exception $e) {}
            try {
                DB::statement('ALTER TABLE payouts DROP CONSTRAINT chk_payouts_amount');
            } catch (\Exception $e) {}
            try {
                DB::statement('ALTER TABLE adjustments DROP CONSTRAINT chk_adjustments_amount');
            } catch (\Exception $e) {}
        }

        Schema::table('payouts', function (Blueprint $table) {
            try {
                $table->dropForeign('fk_payouts_manual_paid_by');
            } catch (\Exception $e) {}
            try {
                $table->dropUnique(['idempotency_key']);
            } catch (\Exception $e) {}
            $table->dropColumn('idempotency_key');
        });

        Schema::table('revenue_records', function (Blueprint $table) {
            try {
                $table->dropIndex('revenue_records_closing_date_index');
            } catch (\Exception $e) {}
        });
    }
};
