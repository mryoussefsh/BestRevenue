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
            ['key' => 'tracking_verify_frequency'],
            [
                'value' => 'hourly',
                'group' => 'gam',
                'label' => 'Tracking Verification Frequency (daily, hourly, minutes)',
                'type' => 'string',
            ]
        );

        \App\Models\Setting::updateOrCreate(
            ['key' => 'tracking_verify_interval'],
            [
                'value' => '1',
                'group' => 'gam',
                'label' => 'Tracking Verification Interval (Hours or Minutes multiplier)',
                'type' => 'integer',
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \App\Models\Setting::whereIn('key', ['tracking_verify_frequency', 'tracking_verify_interval'])->delete();
    }
};
