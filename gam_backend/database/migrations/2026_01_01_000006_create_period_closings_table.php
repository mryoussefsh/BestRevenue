<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('period_closings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->smallInteger('period_year');
            $table->tinyInteger('period_month'); // 1–12
            $table->enum('status', ['open', 'closing', 'closed'])->default('open');
            $table->timestamp('closed_at')->nullable();
            $table->uuid('closed_by')->nullable(); // user id of admin or null if auto
            $table->decimal('total_gross_revenue', 16, 6)->default(0); // [ADMIN ONLY]
            $table->decimal('total_publisher_earnings', 16, 6)->default(0);
            $table->bigInteger('total_impressions')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['period_year', 'period_month']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('period_closings');
    }
};
