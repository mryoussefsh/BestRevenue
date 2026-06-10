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
        $pendingTickets = Ticket::whereIn('status', ['open', 'in_progress'])->count();

        return response()->json([
            'pending_publishers' => $pendingPublishers,
            'pending_payouts'    => $pendingPayouts,
            'pending_tickets'    => $pendingTickets,
        ]);
    }
}
