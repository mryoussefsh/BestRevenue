<?php

namespace App\Http\Controllers\Publisher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Announcement;
use App\Models\AnnouncementInteraction;
use Illuminate\Support\Facades\Auth;

class AnnouncementController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $publisher = $user->publisher; // assuming publisher relationship exists

        $now = now();

        $announcements = Announcement::where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $now);
            })
            ->get();

        // Filter based on targeting and dismissals
        $filtered = $announcements->filter(function ($announcement) use ($user, $publisher) {
            // Check dismissals
            if ($announcement->allow_dismiss) {
                $dismissed = AnnouncementInteraction::where('announcement_id', $announcement->id)
                    ->where('user_id', $user->id)
                    ->where('action', 'dismiss')
                    ->exists();
                if ($dismissed) return false;
            }

            // Check targeting
            if ($announcement->target_type === 'all') return true;

            if ($announcement->target_type === 'roles') {
                $roles = $announcement->target_roles ?: [];
                if (in_array($user->role, $roles)) return true;
                return false;
            }

            if ($announcement->target_type === 'countries' && $publisher) {
                $countries = $announcement->target_countries ?: [];
                if (in_array($publisher->country, $countries)) return true;
                return false;
            }

            if ($announcement->target_type === 'publishers' && $publisher) {
                $publishers = $announcement->target_publishers ?: [];
                if (in_array($publisher->id, $publishers)) return true;
                return false;
            }

            return false;
        });

        // Sort by priority DESC, then created_at DESC
        $sorted = $filtered->sortByDesc('created_at')->sortByDesc('priority')->values();

        return response()->json(['data' => $sorted]);
    }

    public function interact(Request $request, $id)
    {
        $validated = $request->validate([
            'action' => 'required|in:view,dismiss,click',
            'button_index' => 'nullable|integer'
        ]);

        $user = Auth::user();

        // To avoid spamming 'view' interactions, we can check if a view already exists for this user today, or just log it.
        // For simplicity and accurate stats, we'll log it.
        // But for 'dismiss', we only need one.
        if ($validated['action'] === 'dismiss') {
            $existing = AnnouncementInteraction::where('announcement_id', $id)
                ->where('user_id', $user->id)
                ->where('action', 'dismiss')
                ->first();
            if ($existing) {
                return response()->json(['message' => 'Already dismissed']);
            }
        }

        AnnouncementInteraction::create([
            'announcement_id' => $id,
            'user_id' => $user->id,
            'action' => $validated['action'],
            'button_index' => $validated['button_index'] ?? null,
        ]);

        return response()->json(['message' => 'Interaction logged']);
    }
}
