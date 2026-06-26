<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'admin@mindorax.com')->first();
        if (!$user) {
            User::create([
                'id'       => Str::uuid()->toString(),
                'email'    => 'admin@mindorax.com',
                'name'     => 'Platform Admin',
                'password' => Hash::make('admin123456'),
                'role'     => 'admin',
                'is_active'=> true,
            ]);
        } else {
            $user->update([
                'name'     => 'Platform Admin',
                'password' => Hash::make('admin123456'),
                'role'     => 'admin',
                'is_active'=> true,
            ]);
        }

        $this->command->info('Admin user created: admin@mindorax.com / admin123456');
        $this->command->warn('⚠  Change the admin password immediately after first login!');
    }
}
