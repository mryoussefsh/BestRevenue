<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add `last_gam_account_email` to websites so that when a GAM account is
     * deleted we can stamp the email on each previously-linked website.
     * When the same Google account is reconnected via OAuth, we use this column
     * (alongside gam_network_code) to automatically re-link the websites.
     */
    public function up(): void
    {
        Schema::table('websites', function (Blueprint $table) {
            $table->string('last_gam_account_email')->nullable()->after('gam_account_id');
        });
    }

    public function down(): void
    {
        Schema::table('websites', function (Blueprint $table) {
            $table->dropColumn('last_gam_account_email');
        });
    }
};
