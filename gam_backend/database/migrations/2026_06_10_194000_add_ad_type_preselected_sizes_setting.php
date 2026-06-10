<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $defaultSizes = [
            'banner' => ['300x250', '300x600'],
            'reward' => ['1x1'],
            'interstitial' => ['320x480', '480x320'],
            'anchor' => ['Fluid'],
            'float_top' => ['Fluid'],
            'float_bottom' => ['Fluid'],
            'float_fullscreen' => ['1x1'],
        ];

        DB::table('settings')->updateOrInsert(
            ['key' => 'ad_type_preselected_sizes'],
            [
                'value' => json_encode($defaultSizes),
                'group' => 'gam',
                'label' => 'Preselected Sizes per Ad Type',
                'type'  => 'json',
            ]
        );
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'ad_type_preselected_sizes')->delete();
    }
};
