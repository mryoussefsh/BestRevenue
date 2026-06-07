<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('websites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('publisher_id')->constrained('publishers')->cascadeOnDelete();
            $table->string('domain', 255);
            $table->decimal('ratio_override', 5, 4)->nullable(); // [ADMIN ONLY]
            $table->string('gam_network_code', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('publisher_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('websites');
    }
};
