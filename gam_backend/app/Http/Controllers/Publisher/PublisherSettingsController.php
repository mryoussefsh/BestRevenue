<?php

namespace App\Http\Controllers\Publisher;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PublisherSettingsController extends Controller
{
    /**
     * PUT /api/v1/publisher/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $publisher = $user->publisher;

        if (!$publisher) {
            return response()->json(['message' => 'Publisher profile not found.'], 404);
        }

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'phone'    => 'nullable|string|max:100',
            'telegram' => 'nullable|string|max:100',
            'skype'    => 'nullable|string|max:100',
            'country'  => 'nullable|string|max:100',
        ]);

        // Update publisher details
        $publisher->update([
            'name'     => $validated['name'],
            'phone'    => array_key_exists('phone', $validated) ? $validated['phone'] : $publisher->phone,
            'telegram' => array_key_exists('telegram', $validated) ? $validated['telegram'] : $publisher->telegram,
            'skype'    => array_key_exists('skype', $validated) ? $validated['skype'] : $publisher->skype,
            'country'  => array_key_exists('country', $validated) ? $validated['country'] : $publisher->country,
        ]);

        // Sync name to user table
        $user->update([
            'name' => $validated['name'],
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'role'         => $user->role,
                'publisher_id' => $user->publisher_id,
                'is_active'    => $user->is_active,
                'phone'        => $publisher->phone,
                'telegram'     => $publisher->telegram,
                'skype'        => $publisher->skype,
                'country'      => $publisher->country,
                'payment_info' => $publisher->payment_info,
            ]
        ]);
    }

    /**
     * PUT /api/v1/publisher/change-password
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

        return response()->json([
            'message' => 'Password changed successfully.'
        ]);
    }
}
