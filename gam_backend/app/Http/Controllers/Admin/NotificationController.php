<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get recent notifications and unread count for the authenticated admin user.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $unreadCount = $user->unreadNotifications()->count();
        // Fetch up to 50 recent notifications
        $notifications = $user->notifications()->take(50)->get();

        return response()->json([
            'unread_count'  => $unreadCount,
            'notifications' => $notifications
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function read(Request $request, $id)
    {
        $user = Auth::user();
        $notification = $user->notifications()->where('id', $id)->first();
        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json(['success' => true]);
    }

    /**
     * Mark all unread notifications for this user as read.
     */
    public function readAll(Request $request)
    {
        $user = Auth::user();
        $user->unreadNotifications->markAsRead();

        return response()->json(['success' => true]);
    }
}
