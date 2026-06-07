<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Truncate table to avoid duplicate key conflicts when removing country
        DB::table('revenue_records')->truncate();

        Schema::table('revenue_records', function (Blueprint $table) {
            // 2. Create index for foreign key BEFORE dropping the unique index
            $table->index('ad_unit_id');

            // 3. Drop old unique index which includes country
            $table->dropUnique('revenue_unique');

            // 4. Drop country column and its index
            $table->dropIndex(['date', 'country']);
            $table->dropColumn('country');

            // 5. Recreate unique index without country
            $table->unique(['ad_unit_id', 'date', 'hour'], 'revenue_unique');
            
            // 6. Recreate date index
            $table->index(['date']);
            
            // 7. Drop the temporary ad_unit_id index since the new unique index starts with it
            $table->dropIndex(['ad_unit_id']);
        });
    }

    public function down(): void
    {
        Schema::table('revenue_records', function (Blueprint $table) {
            $table->dropUnique('revenue_unique');
            $table->dropIndex(['date']);
            
            $table->string('country')->nullable();
            
            $table->unique(['ad_unit_id', 'date', 'hour', 'country'], 'revenue_unique');
            $table->index(['date', 'country']);
        });
    }
};
