<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Announcement;
use Illuminate\Support\Str;

class AnnouncementController extends Controller
{
    public function index()
    {
        $announcements = Announcement::withCount([
            'interactions as views_count' => function ($query) {
                $query->where('action', 'view');
            },
            'interactions as dismissals_count' => function ($query) {
                $query->where('action', 'dismiss');
            },
            'interactions as clicks_count' => function ($query) {
                $query->where('action', 'click');
            }
        ])->orderBy('created_at', 'desc')->get();

        return response()->json(['data' => $announcements]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'title_ar' => 'nullable|string|max:255',
            'content' => 'required|string',
            'content_ar' => 'nullable|string',
            'type' => 'required|in:banner,modal',
            'style' => 'required|in:info,success,warning,danger',
            'priority' => 'integer',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'allow_dismiss' => 'boolean',
            'buttons' => 'nullable|array',
            'target_type' => 'required|in:all,publishers,countries,roles',
            'target_publishers' => 'nullable|array',
            'target_countries' => 'nullable|array',
            'target_roles' => 'nullable|array',
        ]);

        $validated['id'] = (string) Str::uuid();

        $announcement = Announcement::create($validated);

        return response()->json(['message' => 'Announcement created successfully', 'data' => $announcement], 201);
    }

    public function update(Request $request, $id)
    {
        $announcement = Announcement::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'title_ar' => 'nullable|string|max:255',
            'content' => 'required|string',
            'content_ar' => 'nullable|string',
            'type' => 'required|in:banner,modal',
            'style' => 'required|in:info,success,warning,danger',
            'priority' => 'integer',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'allow_dismiss' => 'boolean',
            'buttons' => 'nullable|array',
            'target_type' => 'required|in:all,publishers,countries,roles',
            'target_publishers' => 'nullable|array',
            'target_countries' => 'nullable|array',
            'target_roles' => 'nullable|array',
        ]);

        $announcement->update($validated);

        return response()->json(['message' => 'Announcement updated successfully', 'data' => $announcement]);
    }

    public function destroy($id)
    {
        $announcement = Announcement::findOrFail($id);
        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted successfully']);
    }
}
