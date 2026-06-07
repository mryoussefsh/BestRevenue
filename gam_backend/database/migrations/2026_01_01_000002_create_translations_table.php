<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('translations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('locale', ['en', 'ar']);
            $table->string('key', 200);
            $table->text('value');
            $table->string('group', 100)->default('general');
            $table->timestamp('updated_at')->nullable();

            $table->unique(['locale', 'key']);
            $table->index('locale');
            $table->index('group');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('translations');
    }
};
