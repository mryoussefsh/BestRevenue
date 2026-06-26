<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use App\Services\AuditLogService;

class AdminProfileController extends Controller
{
    /**
     * PUT /api/v1/admin/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
        ]);

        $oldData = [
            'name'  => $user->name,
            'email' => $user->email,
        ];

        $user->update($validated);

        AuditLogService::log(
            'profile_updated',
            'Admin',
            $user->id,
            $oldData,
            $validated
        );

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'role'         => $user->role,
                'publisher_id' => $user->publisher_id,
                'is_active'    => $user->is_active,
                'roles_list'       => $user->roles_list,
                'permissions_list' => $user->permissions_list,
            ]
        ]);
    }

    /**
     * PUT /api/v1/admin/change-password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'The provided current password does not match our records.',
                'errors' => [
                    'current_password' => ['The current password is incorrect.']
                ]
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        AuditLogService::log(
            'password_changed',
            'Admin',
            $user->id,
            null,
            null
        );

        return response()->json([
            'message' => 'Password changed successfully.'
        ]);
    }
}
