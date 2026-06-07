<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('adjustments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('publisher_id');
            $table->decimal('amount', 10, 2);
            $table->text('notes');
            $table->enum('status', ['pending', 'applied'])->default('pending');
            $table->uuid('period_closing_id')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('publisher_id')->references('id')->on('publishers')->cascadeOnDelete();
            $table->foreign('period_closing_id')->references('id')->on('period_closings')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adjustments');
    }
};
