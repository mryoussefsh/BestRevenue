<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Permission;

class PermissionsController extends Controller
{
    public function index()
    {
        $permissions = Permission::orderBy('name')->get();

        // Categorize permissions for nicer frontend rendering
        $categories = [
            'settings' => [
                'display_name' => 'Settings & Configuration',
                'permissions' => ['manage_settings', 'manage_email_templates', 'manage_translations'],
            ],
            'operations' => [
                'display_name' => 'Core Operations',
                'permissions' => ['view_publishers', 'manage_publishers', 'manage_websites', 'manage_ad_units', 'manage_gam_accounts'],
            ],
            'financials' => [
                'display_name' => 'Financials & Closings',
                'permissions' => ['manage_closings', 'manage_payouts', 'manage_revenue'],
            ],
            'content' => [
                'display_name' => 'Communications & Content',
                'permissions' => ['manage_announcements', 'manage_pages'],
            ],
            'support' => [
                'display_name' => 'Customer Support',
                'permissions' => ['manage_tickets'],
            ],
            'administration' => [
                'display_name' => 'Platform Administration',
                'permissions' => ['manage_admins'],
            ],
        ];

        return response()->json([
            'flat' => $permissions->pluck('name'),
            'categorized' => $categories,
        ]);
    }
}
