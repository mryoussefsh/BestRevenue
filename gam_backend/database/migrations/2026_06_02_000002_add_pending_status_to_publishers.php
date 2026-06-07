<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Modify the status enum to include 'pending'
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE `publishers` MODIFY `status` ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active'");
        }
    }

    public function down(): void
    {
        // Revert back to original — first update any 'pending' to 'active'
        DB::table('publishers')->where('status', 'pending')->update(['status' => 'active']);
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE `publishers` MODIFY `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active'");
        }
    }
};
