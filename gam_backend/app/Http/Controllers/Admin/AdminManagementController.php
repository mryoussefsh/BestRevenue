<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class AdminManagementController extends Controller
{
    public function index()
    {
        // Only return users who are admins
        $admins = User::where('role', 'admin')
            ->with(['roles', 'permissions'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($admins);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'is_active' => 'boolean',
            'roles' => 'array',
            'roles.*' => 'string|exists:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $admin = User::create([
            'id' => Str::uuid()->toString(),
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // Sync roles and direct permissions
        if (isset($validated['roles'])) {
            $admin->syncRoles($validated['roles']);
        }
        if (isset($validated['permissions'])) {
            $admin->syncPermissions($validated['permissions']);
        }

        return response()->json($admin->load(['roles', 'permissions']), 201);
    }

    public function show($id)
    {
        $admin = User::where('role', 'admin')->findOrFail($id);
        return response()->json($admin->load(['roles', 'permissions']));
    }

    public function update(Request $request, $id)
    {
        $admin = User::where('role', 'admin')->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($admin->id),
            ],
            'password' => 'nullable|string|min:8',
            'is_active' => 'boolean',
            'roles' => 'array',
            'roles.*' => 'string|exists:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        // Check if this is the primary administrator.
        $primaryAdmin = User::where('role', 'admin')->orderBy('created_at', 'asc')->first();
        $isPrimary = $primaryAdmin && $primaryAdmin->id === $admin->id;

        if ($isPrimary) {
            // Primary administrator cannot be suspended or have their role altered.
            $validated['is_active'] = true;
        }

        $admin->name = $validated['name'];
        $admin->email = $validated['email'];
        if (!empty($validated['password'])) {
            $admin->password = Hash::make($validated['password']);
        }
        $admin->is_active = $validated['is_active'] ?? true;
        $admin->save();

        if ($isPrimary) {
            // Ensure primary admin always retains the Super Admin role and clears direct overrides
            $admin->syncRoles(['Super Admin']);
            $admin->syncPermissions([]);
        } else {
            if (isset($validated['roles'])) {
                $admin->syncRoles($validated['roles']);
            }
            if (isset($validated['permissions'])) {
                $admin->syncPermissions($validated['permissions']);
            }
        }

        return response()->json($admin->load(['roles', 'permissions']));
    }

    public function destroy($id)
    {
        $admin = User::where('role', 'admin')->findOrFail($id);

        // Guard: Prevent self-deletion
        if (auth()->id() === $admin->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        // Guard: Prevent primary admin deletion
        $primaryAdmin = User::where('role', 'admin')->orderBy('created_at', 'asc')->first();
        if ($primaryAdmin && $primaryAdmin->id === $admin->id) {
            return response()->json(['message' => 'The primary administrator account cannot be deleted.'], 422);
        }

        $admin->delete();

        return response()->json(['message' => 'Administrator deleted successfully.']);
    }
}
