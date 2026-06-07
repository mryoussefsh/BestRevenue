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
            ['key' => 'gam_sync_frequency'],
            [
                'value' => 'hourly',
                'group' => 'gam',
                'label' => 'GAM Sync Frequency (daily, hourly, minutes)',
                'type' => 'string',
            ]
        );

        \App\Models\Setting::updateOrCreate(
            ['key' => 'gam_sync_interval'],
            [
                'value' => '1',
                'group' => 'gam',
                'label' => 'GAM Sync Interval (Hours or Minutes multiplier)',
                'type' => 'integer',
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \App\Models\Setting::whereIn('key', ['gam_sync_frequency', 'gam_sync_interval'])->delete();
    }
};
