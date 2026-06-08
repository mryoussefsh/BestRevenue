<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('revenue_records', function (Blueprint $table) {
            // Active View (viewability) metrics from GAM.
            // eligible = impressions that were measurable by Active View
            // viewable = impressions that were actually viewable (>= 50% visible for >= 1 second)
            $table->bigInteger('active_view_eligible_impressions')->default(0)->after('unfilled_impressions');
            $table->bigInteger('active_view_viewable_impressions')->default(0)->after('active_view_eligible_impressions');
        });
    }

    public function down(): void
    {
        Schema::table('revenue_records', function (Blueprint $table) {
            $table->dropColumn(['active_view_eligible_impressions', 'active_view_viewable_impressions']);
        });
    }
};
