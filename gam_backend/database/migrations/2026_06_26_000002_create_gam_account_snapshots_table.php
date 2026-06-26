<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stores a snapshot of a deleted GAM account's metadata (network_code, ads_txt)
     * keyed by email, so they can be restored automatically when the same Google
     * account is reconnected via OAuth.
     */
    public function up(): void
    {
        Schema::create('gam_account_snapshots', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('name')->nullable();
            $table->string('network_code', 50)->nullable();
            $table->text('ads_txt')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gam_account_snapshots');
    }
};
