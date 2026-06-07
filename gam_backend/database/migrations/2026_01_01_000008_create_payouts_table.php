<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('publisher_id')->constrained('publishers')->cascadeOnDelete();
            $table->foreignUuid('period_closing_id')->constrained('period_closings');
            $table->smallInteger('period_year');
            $table->tinyInteger('period_month');
            $table->decimal('amount', 12, 2)->default(0);       // calculated earnings
            $table->decimal('adjustment', 12, 2)->default(0);   // admin manual adjustment (±)
            $table->decimal('final_amount', 12, 2)->default(0); // amount + adjustment
            $table->enum('status', ['pending', 'approved', 'rejected', 'paid'])->default('pending');
            $table->text('admin_note')->nullable();              // [ADMIN ONLY]
            $table->string('payment_method', 100)->nullable();  // snapshot at payout time
            $table->string('payment_reference', 255)->nullable(); // tx ID shown to publisher when paid
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            // One payout per publisher per closing
            $table->unique(['publisher_id', 'period_closing_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
