<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * FIX [DB / FIX-20]:
 * Convert gam_accounts.status from a plain VARCHAR to a proper ENUM.
 *
 * Previously, status was an unconstrained string column. Any value could be inserted,
 * leading to inconsistent states like 'error', 'broken', or empty strings that the
 * application code did not handle.
 *
 * Valid states:
 *   - active:       Token is valid and syncing works.
 *   - disconnected: Admin manually disconnected the account.
 *   - expired:      Token has expired and needs to be refreshed or reconnected.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Normalize any non-standard status values before altering the column.
        // This prevents "Data truncated for column 'status'" errors on existing rows.
        DB::statement("
            UPDATE gam_accounts
            SET status = 'active'
            WHERE status NOT IN ('active', 'disconnected', 'expired')
        ");

        // Step 2: Alter the column to a strict ENUM.
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("
                ALTER TABLE gam_accounts
                MODIFY COLUMN status ENUM('active', 'disconnected', 'expired') NOT NULL DEFAULT 'active'
            ");
        }
    }

    public function down(): void
    {
        // Revert to plain VARCHAR(50)
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("
                ALTER TABLE gam_accounts
                MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active'
            ");
        }
    }
};
