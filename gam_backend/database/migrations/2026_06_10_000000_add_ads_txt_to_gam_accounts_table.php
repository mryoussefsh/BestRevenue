<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gam_accounts', function (Blueprint $table) {
            $table->text('ads_txt')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('gam_accounts', function (Blueprint $table) {
            $table->dropColumn('ads_txt');
        });
    }
};
