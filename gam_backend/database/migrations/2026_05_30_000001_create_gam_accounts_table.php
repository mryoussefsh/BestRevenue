<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gam_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');                          // Friendly label e.g. "Main Account"
            $table->string('email');                         // Google account email
            $table->string('network_code')->nullable();      // GAM network code (auto-filled)
            $table->text('access_token')->nullable();        // Encrypted
            $table->text('refresh_token')->nullable();       // Encrypted
            $table->timestamp('token_expires_at')->nullable();
            $table->enum('status', ['active', 'expired', 'disconnected'])->default('active');
            $table->timestamp('last_synced_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::table('websites', function (Blueprint $table) {
            $table->uuid('gam_account_id')->nullable()->after('publisher_id');
            $table->foreign('gam_account_id')
                  ->references('id')
                  ->on('gam_accounts')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('websites', function (Blueprint $table) {
            $table->dropForeign(['gam_account_id']);
            $table->dropColumn('gam_account_id');
        });

        Schema::dropIfExists('gam_accounts');
    }
};
