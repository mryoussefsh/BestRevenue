<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Announcement;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use App\Services\AuditLogService;

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

        Cache::forget('active_announcements');

        AuditLogService::log(
            'created',
            'Announcement',
            $announcement->id,
            null,
            $announcement->toArray()
        );

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

        $oldData = $announcement->toArray();
        $announcement->update($validated);

        Cache::forget('active_announcements');

        AuditLogService::log(
            'updated',
            'Announcement',
            $announcement->id,
            $oldData,
            $announcement->toArray()
        );

        return response()->json(['message' => 'Announcement updated successfully', 'data' => $announcement]);
    }

    public function destroy($id)
    {
        $announcement = Announcement::findOrFail($id);
        $oldData = $announcement->toArray();
        $announcement->delete();

        Cache::forget('active_announcements');

        AuditLogService::log(
            'deleted',
            'Announcement',
            $id,
            $oldData,
            null
        );

        return response()->json(['message' => 'Announcement deleted successfully']);
    }
}
