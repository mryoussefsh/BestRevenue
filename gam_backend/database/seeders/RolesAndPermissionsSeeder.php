<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Define system permissions
        $permissions = [
            // Settings & System
            'manage_settings',
            'manage_email_templates',
            'manage_translations',
            
            // Core Platform
            'view_publishers',
            'manage_publishers',
            'manage_websites',
            'manage_ad_units',
            'manage_gam_accounts',
            
            // Financials
            'manage_closings',
            'manage_payouts',
            'manage_revenue',
            
            // Communications & Pages
            'manage_announcements',
            'manage_pages',
            
            // Support
            'manage_tickets',
            
            // Admin management
            'manage_admins',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // 2. Create roles and assign seeded permissions

        // Super Admin
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        // Finance Manager
        $financeManager = Role::firstOrCreate(['name' => 'Finance Manager', 'guard_name' => 'web']);
        $financeManager->syncPermissions([
            'manage_publishers',
            'manage_closings',
            'manage_payouts',
            'manage_revenue',
        ]);

        // Ad Ops Manager
        $adOps = Role::firstOrCreate(['name' => 'Ad Ops Manager', 'guard_name' => 'web']);
        $adOps->syncPermissions([
            'manage_websites',
            'manage_ad_units',
            'manage_gam_accounts',
            'manage_revenue',
        ]);

        // Support Agent
        $supportAgent = Role::firstOrCreate(['name' => 'Support Agent', 'guard_name' => 'web']);
        $supportAgent->syncPermissions([
            'manage_tickets',
            'manage_announcements',
            'view_publishers',
        ]);

        // Content Manager
        $contentManager = Role::firstOrCreate(['name' => 'Content Manager', 'guard_name' => 'web']);
        $contentManager->syncPermissions([
            'manage_pages',
            'manage_translations',
            'manage_announcements',
            'manage_email_templates',
        ]);

        // 3. Assign Super Admin role to the primary admin user.
        // As per resolved clarifications, we find the earliest created admin in the database.
        $primaryAdmin = User::where('role', 'admin')->orderBy('created_at', 'asc')->first();
        if ($primaryAdmin) {
            $primaryAdmin->assignRole('Super Admin');
        }
    }
}
