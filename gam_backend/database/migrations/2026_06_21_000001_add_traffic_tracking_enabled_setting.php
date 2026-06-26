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
            ['key' => 'traffic_tracking_enabled'],
            [
                'value' => 'true',
                'group' => 'gam',
                'label' => 'Enable Traffic Tracking System (on/off)',
                'type' => 'boolean',
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \App\Models\Setting::where('key', 'traffic_tracking_enabled')->delete();
    }
};
