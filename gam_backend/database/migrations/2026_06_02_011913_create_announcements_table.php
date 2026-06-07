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
        Schema::create('announcements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('content');
            $table->enum('type', ['banner', 'modal'])->default('banner');
            $table->integer('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->boolean('allow_dismiss')->default(true);
            $table->json('buttons')->nullable();
            $table->enum('target_type', ['all', 'publishers', 'countries', 'roles'])->default('all');
            $table->json('target_publishers')->nullable();
            $table->json('target_countries')->nullable();
            $table->json('target_roles')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
