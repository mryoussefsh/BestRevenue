<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('gam_accounts') && !Schema::hasColumn('gam_accounts', 'sync_enabled')) {
            Schema::table('gam_accounts', function (Blueprint $table) {
                $table->boolean('sync_enabled')->default(true)->after('status');
            });
        }

        $exists = DB::table('settings')->where('key', 'global_sync_enabled')->exists();
        if (!$exists) {
            DB::table('settings')->insert([
                'key'   => 'global_sync_enabled',
                'value' => 'true',
                'group' => 'gam',
                'label' => 'Global Sync Enabled',
                'type'  => 'boolean',
            ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('gam_accounts') && Schema::hasColumn('gam_accounts', 'sync_enabled')) {
            Schema::table('gam_accounts', function (Blueprint $table) {
                $table->dropColumn('sync_enabled');
            });
        }

        DB::table('settings')->where('key', 'global_sync_enabled')->delete();
    }
};
