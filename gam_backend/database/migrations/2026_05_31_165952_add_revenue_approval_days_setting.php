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
            ['key' => 'revenue_approval_days'],
            [
                'value' => '3',
                'group' => 'gam',
                'label' => 'Days to Hold Synced Revenue as Pending',
                'type' => 'integer',
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \App\Models\Setting::where('key', 'revenue_approval_days')->delete();
    }
};
