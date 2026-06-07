<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FIX [DB / FIX-27]:
 * Add a nullable foreign key on ratio_history.changed_by → users.id.
 *
 * Previously this column had no FK constraint. If a user was deleted, ratio_history
 * would have a dangling reference showing an unknown user as the change author.
 *
 * Using nullOnDelete() means: if the user is deleted, set changed_by to NULL
 * (preserving the history record while indicating the changer is no longer in the system).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ratio_history', function (Blueprint $table) {
            // Step 1: Ensure the column is nullable (it may already be — safe to re-apply).
            $table->string('changed_by', 36)->nullable()->change();
        });

        Schema::table('ratio_history', function (Blueprint $table) {
            // Step 2: Set any dangling changed_by values to NULL before adding the FK.
            // This prevents "Cannot add or update a child row: a foreign key constraint fails".
            \Illuminate\Support\Facades\DB::statement("
                UPDATE ratio_history
                SET changed_by = NULL
                WHERE changed_by IS NOT NULL
                  AND changed_by NOT IN (SELECT id FROM users)
            ");

            // Step 3: Add the foreign key with nullOnDelete.
            $table->foreign('changed_by')
                  ->references('id')
                  ->on('users')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('ratio_history', function (Blueprint $table) {
            $table->dropForeign(['changed_by']);
        });
    }
};
