<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesController extends Controller
{
    protected $systemRoles = [
        'Super Admin',
        'Finance Manager',
        'Ad Ops Manager',
        'Support Agent',
        'Content Manager',
    ];

    public function index()
    {
        $roles = Role::with('permissions')->get();
        return response()->json($roles);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json($role->load('permissions'), 201);
    }

    public function show($id)
    {
        $role = Role::with('permissions')->findOrFail($id);
        return response()->json($role);
    }

    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'name')->ignore($role->id),
            ],
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        // Guard: Prevent renaming system default roles but allow editing their permissions
        if (in_array($role->name, $this->systemRoles)) {
            $role->syncPermissions($validated['permissions']);
        } else {
            $role->name = $validated['name'];
            $role->save();
            if (isset($validated['permissions'])) {
                $role->syncPermissions($validated['permissions']);
            }
        }

        return response()->json($role->load('permissions'));
    }

    public function destroy($id)
    {
        $role = Role::findOrFail($id);

        // Guard: Prevent deleting system default roles
        if (in_array($role->name, $this->systemRoles)) {
            return response()->json(['message' => 'System default roles cannot be deleted.'], 422);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted successfully.']);
    }
}
