<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed permissions and default roles
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_publisher_cannot_access_admin_management_endpoints(): void
    {
        $publisher = User::create([
            'name'      => 'Test Publisher',
            'email'     => 'pub@example.com',
            'password'  => Hash::make('password123'),
            'role'      => 'publisher',
            'is_active' => true,
        ]);

        Sanctum::actingAs($publisher);

        $response = $this->getJson('/api/v1/admin/admins');
        $response->assertStatus(403); // Forbidden by role check middleware
    }

    public function test_admin_without_manage_admins_permission_cannot_access_endpoints(): void
    {
        $admin = User::create([
            'name'      => 'Regular Admin',
            'email'     => 'admin2@example.com',
            'password'  => Hash::make('password123'),
            'role'      => 'admin',
            'is_active' => true,
        ]);

        // Assign a role without manage_admins permission, e.g., Support Agent
        $admin->assignRole('Support Agent');

        Sanctum::actingAs($admin);

        // Access administrator list
        $response = $this->getJson('/api/v1/admin/admins');
        $response->assertStatus(403); // Forbidden by can:manage_admins middleware

        // Access roles list
        $response2 = $this->getJson('/api/v1/admin/roles');
        $response2->assertStatus(403);
    }

    public function test_super_admin_can_crud_administrators(): void
    {
        $superAdmin = User::create([
            'name'      => 'Super Admin User',
            'email'     => 'super@example.com',
            'password'  => Hash::make('password123'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
        $superAdmin->assignRole('Super Admin');

        Sanctum::actingAs($superAdmin);

        // 1. Create a new admin
        $createResponse = $this->postJson('/api/v1/admin/admins', [
            'name'        => 'New Finance Admin',
            'email'       => 'finance@example.com',
            'password'    => 'secret1234',
            'is_active'   => true,
            'roles'       => ['Finance Manager'],
            'permissions' => ['manage_settings'] // direct override
        ]);

        $createResponse->assertStatus(201);
        $createResponse->assertJsonPath('name', 'New Finance Admin');
        
        $newAdminId = $createResponse->json('id');

        // Assert database holds assignments
        $this->assertDatabaseHas('users', ['email' => 'finance@example.com']);
        $newAdmin = User::find($newAdminId);
        $this->assertTrue($newAdmin->hasRole('Finance Manager'));
        $this->assertTrue($newAdmin->hasDirectPermission('manage_settings'));

        // 2. Update the admin
        $updateResponse = $this->putJson("/api/v1/admin/admins/{$newAdminId}", [
            'name'        => 'Updated Finance Admin',
            'email'       => 'finance@example.com',
            'is_active'   => false, // suspend
            'roles'       => ['Support Agent'],
            'permissions' => [] // clear direct overrides
        ]);

        $updateResponse->assertStatus(200);
        
        $newAdmin->refresh();
        $this->assertEquals('Updated Finance Admin', $newAdmin->name);
        $this->assertFalse($newAdmin->is_active);
        $this->assertTrue($newAdmin->hasRole('Support Agent'));
        $this->assertFalse($newAdmin->hasRole('Finance Manager'));
        $this->assertFalse($newAdmin->hasDirectPermission('manage_settings'));

        // 3. Delete the admin
        $deleteResponse = $this->deleteJson("/api/v1/admin/admins/{$newAdminId}");
        $deleteResponse->assertStatus(200);
        $this->assertSoftDeletedOrMissing($newAdmin);
    }

    public function test_admin_cannot_delete_themselves(): void
    {
        $superAdmin = User::create([
            'name'      => 'Super Admin User',
            'email'     => 'super@example.com',
            'password'  => Hash::make('password123'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
        $superAdmin->assignRole('Super Admin');

        Sanctum::actingAs($superAdmin);

        $response = $this->deleteJson("/api/v1/admin/admins/{$superAdmin->id}");
        $response->assertStatus(422);
        $response->assertJsonPath('message', 'You cannot delete your own account.');
    }

    public function test_primary_admin_is_protected_from_deletion_deactivation_and_role_changes(): void
    {
        // First admin created is the primary admin
        $primaryAdmin = User::create([
            'name'      => 'Primary Admin',
            'email'     => 'primary@example.com',
            'password'  => Hash::make('password123'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
        $primaryAdmin->assignRole('Super Admin');

        // Create second super admin who will attempt to mutate the primary
        $secondAdmin = User::create([
            'name'      => 'Second Admin',
            'email'     => 'second@example.com',
            'password'  => Hash::make('password123'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
        $secondAdmin->assignRole('Super Admin');

        Sanctum::actingAs($secondAdmin);

        // Attempt Deletion
        $deleteResponse = $this->deleteJson("/api/v1/admin/admins/{$primaryAdmin->id}");
        $deleteResponse->assertStatus(422);
        $deleteResponse->assertJsonPath('message', 'The primary administrator account cannot be deleted.');

        // Attempt Suspension and Role Alteration
        $updateResponse = $this->putJson("/api/v1/admin/admins/{$primaryAdmin->id}", [
            'name'        => 'Modified Primary Admin Name',
            'email'       => 'primary@example.com',
            'is_active'   => false, // try to suspend
            'roles'       => ['Support Agent'], // try to downgrade role
            'permissions' => []
        ]);

        $updateResponse->assertStatus(200);
        $primaryAdmin->refresh();

        $this->assertEquals('Modified Primary Admin Name', $primaryAdmin->name);
        $this->assertTrue($primaryAdmin->is_active); // Still active (cannot suspend)
        $this->assertTrue($primaryAdmin->hasRole('Super Admin')); // Still Super Admin (cannot downgrade)
        $this->assertFalse($primaryAdmin->hasRole('Support Agent'));
    }

    public function test_custom_roles_crud_and_system_role_protection(): void
    {
        $superAdmin = User::create([
            'name'      => 'Super Admin User',
            'email'     => 'super@example.com',
            'password'  => Hash::make('password123'),
            'role'      => 'admin',
            'is_active' => true,
        ]);
        $superAdmin->assignRole('Super Admin');

        Sanctum::actingAs($superAdmin);

        // 1. Create a custom role
        $createResponse = $this->postJson('/api/v1/admin/roles', [
            'name'        => 'Custom Operator',
            'permissions' => ['manage_settings', 'manage_tickets']
        ]);

        $createResponse->assertStatus(201);
        $roleId = $createResponse->json('id');
        
        $role = Role::find($roleId);
        $this->assertEquals('Custom Operator', $role->name);
        $this->assertTrue($role->hasPermissionTo('manage_settings'));
        $this->assertTrue($role->hasPermissionTo('manage_tickets'));

        // 2. Update role permissions and name
        $updateResponse = $this->putJson("/api/v1/admin/roles/{$roleId}", [
            'name'        => 'Renamed Custom Operator',
            'permissions' => ['manage_tickets']
        ]);
        $updateResponse->assertStatus(200);
        
        $role->refresh();
        $this->assertEquals('Renamed Custom Operator', $role->name);
        $this->assertTrue($role->hasPermissionTo('manage_tickets'));
        $this->assertFalse($role->hasPermissionTo('manage_settings'));

        // 3. Delete custom role
        $deleteResponse = $this->deleteJson("/api/v1/admin/roles/{$roleId}");
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('roles', ['id' => $roleId]);

        // 4. Try to delete a system default role (e.g. Finance Manager)
        $systemRole = Role::where('name', 'Finance Manager')->first();
        $deleteSystemResponse = $this->deleteJson("/api/v1/admin/roles/{$systemRole->id}");
        $deleteSystemResponse->assertStatus(422);
        $deleteSystemResponse->assertJsonPath('message', 'System default roles cannot be deleted.');

        // 5. Try to rename a system default role (should block name change but allow permission updates)
        $renameSystemResponse = $this->putJson("/api/v1/admin/roles/{$systemRole->id}", [
            'name'        => 'Finance Manager Renamed',
            'permissions' => ['manage_payouts'] // update permissions
        ]);
        $renameSystemResponse->assertStatus(200);
        
        $systemRole->refresh();
        $this->assertEquals('Finance Manager', $systemRole->name); // Name is NOT changed
        $this->assertTrue($systemRole->hasPermissionTo('manage_payouts'));
    }

    private function assertSoftDeletedOrMissing($model): void
    {
        if (in_array(\Illuminate\Database\Eloquent\SoftDeletes::class, class_uses_recursive($model))) {
            $this->assertSoftDeleted($model);
        } else {
            $this->assertDatabaseMissing($model->getTable(), [$model->getKeyName() => $model->getKey()]);
        }
    }
}
