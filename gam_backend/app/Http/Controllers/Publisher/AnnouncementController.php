<?php

namespace App\Http\Controllers\Publisher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Announcement;
use App\Models\AnnouncementInteraction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class AnnouncementController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $publisher = $user->publisher;
        $now = now();

        // Query 1: load all currently active announcements (cached for 1 hour, invalidated when admin makes changes)
        $announcements = Cache::remember('active_announcements', 3600, function () use ($now) {
            return Announcement::where('is_active', true)
                ->where(function ($q) use ($now) {
                    $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
                })
                ->where(function ($q) use ($now) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', $now);
                })
                ->orderByDesc('priority')
                ->orderByDesc('created_at')
                ->get();
        });

        if ($announcements->isEmpty()) {
            return response()->json(['data' => []]);
        }

        // Query 2: load all dismissed IDs for this user in one shot
        $dismissedIds = AnnouncementInteraction::where('user_id', $user->id)
            ->where('action', 'dismiss')
            ->pluck('announcement_id')
            ->flip(); // use as a hash map for O(1) lookup

        $userRole    = $user->role;
        $pubId       = $publisher?->id;
        $pubCountry  = $publisher?->country;

        $filtered = $announcements->filter(function ($a) use ($userRole, $pubId, $pubCountry, $dismissedIds) {
            // Hide dismissed
            if ($a->allow_dismiss && isset($dismissedIds[$a->id])) {
                return false;
            }

            switch ($a->target_type) {
                case 'all':
                    return true;

                case 'roles':
                    return in_array($userRole, $a->target_roles ?: []);

                case 'publishers':
                    return $pubId && in_array($pubId, $a->target_publishers ?: []);

                case 'countries':
                    if (!$pubCountry) return false;
                    $countries = $a->target_countries ?: [];
                    if (in_array($pubCountry, $countries)) return true;
                    $code = \App\Http\Controllers\Auth\RegisterController::getCountryCodeFromName($pubCountry);
                    if ($code && in_array($code, $countries)) return true;
                    $name = \App\Http\Controllers\Auth\RegisterController::getCountryNameFromCode($pubCountry);
                    return $name && in_array($name, $countries);
            }

            return false;
        });

        return response()->json(['data' => $filtered->values()]);
    }

    public function interact(Request $request, $id)
    {
        $validated = $request->validate([
            'action'       => 'required|in:dismiss,click',
            'button_index' => 'nullable|integer',
        ]);

        $user = Auth::user();

        // Only store one dismiss per user per announcement
        if ($validated['action'] === 'dismiss') {
            AnnouncementInteraction::firstOrCreate(
                ['announcement_id' => $id, 'user_id' => $user->id, 'action' => 'dismiss'],
                ['button_index'    => null]
            );
            return response()->json(['message' => 'Dismissed']);
        }

        // Click: always log
        AnnouncementInteraction::create([
            'announcement_id' => $id,
            'user_id'         => $user->id,
            'action'          => 'click',
            'button_index'    => $validated['button_index'] ?? null,
        ]);

        return response()->json(['message' => 'Clicked']);
    }
}
