<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        \App\Models\Setting::updateOrCreate(
            ['key' => 'approve_earnings_day'],
            [
                'value' => '1',
                'group' => 'payout',
                'label' => 'Approve Earnings Day of Next Month (1–28)',
                'type' => 'integer',
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \App\Models\Setting::where('key', 'approve_earnings_day')->delete();
    }
};
