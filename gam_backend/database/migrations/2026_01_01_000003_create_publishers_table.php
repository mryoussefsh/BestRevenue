<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publishers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 200);
            $table->string('email', 255)->unique();
            $table->decimal('default_ratio', 5, 4)->default(0.7000); // [ADMIN ONLY]
            $table->enum('status', ['active', 'suspended'])->default('active');
            $table->json('payment_info')->nullable(); // {"method": "PayPal", "account": "..."}
            $table->text('notes')->nullable(); // admin internal notes
            $table->timestamps();
        });

        // Now that publishers table exists, add FK on users
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('publisher_id')->references('id')->on('publishers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['publisher_id']);
        });
        Schema::dropIfExists('publishers');
    }
};
