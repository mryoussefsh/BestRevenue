<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Publisher;
use App\Models\Payout;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;

class SidebarStatsController extends Controller
{
    /**
     * Get counts for pending items to show in the sidebar badges.
     */
    public function index(): JsonResponse
    {
        $pendingPublishers = Publisher::where('status', 'pending')->count();
        $pendingPayouts = Payout::where('status', 'pending')->count();
        $pendingTickets = Ticket::whereIn('status', ['open', 'in_progress'])
            ->where(function ($q) {
                $q->whereNull('last_viewed_by_admin_at')
                  ->orWhereExists(function ($sub) {
                      $sub->select(\Illuminate\Support\Facades\DB::raw(1))
                          ->from('ticket_messages')
                          ->whereColumn('ticket_messages.ticket_id', 'tickets.id')
                          ->where('ticket_messages.is_admin_reply', false)
                          ->whereColumn('ticket_messages.created_at', '>', 'tickets.last_viewed_by_admin_at');
                  });
            })
            ->whereHas('messages', function ($sub) {
                $sub->where('is_admin_reply', false);
            })
            ->count();

        return response()->json([
            'pending_publishers' => $pendingPublishers,
            'pending_payouts'    => $pendingPayouts,
            'pending_tickets'    => $pendingTickets,
        ]);
    }
}
