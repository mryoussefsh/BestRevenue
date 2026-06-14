<?php

namespace App\Http\Controllers\Publisher;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\Setting;
use App\Mail\TicketCreatedAdminMail;
use App\Mail\TicketRepliedAdminMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class PublisherTicketController extends Controller
{
    /**
     * GET /api/v1/publisher/tickets
     */
    public function index(Request $request): JsonResponse
    {
        $publisherId = $request->user()->publisher_id;

        if (!$publisherId) {
            return response()->json(['message' => 'Publisher profile not found.'], 404);
        }

        $query = Ticket::where('publisher_id', $publisherId)
            ->with(['assignee'])
            ->orderBy('updated_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $tickets = $query->paginate(15);

        $hasActiveTicket = Ticket::where('publisher_id', $publisherId)
            ->whereIn('status', ['open', 'in_progress'])
            ->exists();

        $unreadRepliesCount = Ticket::where('publisher_id', $publisherId)
            ->where('status', '!=', 'closed')
            ->where(function ($q) {
                $q->whereNull('last_viewed_by_publisher_at')
                  ->orWhereExists(function ($sub) {
                      $sub->select(DB::raw(1))
                          ->from('ticket_messages')
                          ->whereColumn('ticket_messages.ticket_id', 'tickets.id')
                          ->where('ticket_messages.is_admin_reply', true)
                          ->whereColumn('ticket_messages.created_at', '>', 'tickets.last_viewed_by_publisher_at');
                  });
            })
            ->whereHas('messages', function ($sub) {
                $sub->where('is_admin_reply', true);
            })
            ->count();

        $responseArray = $tickets->toArray();
        $responseArray['has_active_ticket'] = $hasActiveTicket;
        $responseArray['unread_replies_count'] = $unreadRepliesCount;

        return response()->json($responseArray);
    }

    /**
     * POST /api/v1/publisher/tickets
     */
    public function store(Request $request): JsonResponse
    {
        $publisherId = $request->user()->publisher_id;

        if (!$publisherId) {
            return response()->json(['message' => 'Publisher profile not found.'], 404);
        }

        $request->validate([
            'subject'  => 'required|string|max:255',
            'category' => 'required|string|in:billing,technical,gam,other',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'message'  => 'required|string|max:5000',
        ]);

        $hasActiveTicket = Ticket::where('publisher_id', $publisherId)
            ->whereIn('status', ['open', 'in_progress'])
            ->exists();

        if ($hasActiveTicket) {
            return response()->json([
                'message' => 'You already have an active support ticket. Please resolve or close it before opening a new one.'
            ], 422);
        }

        $ticket = DB::transaction(function () use ($request, $publisherId) {
            $ticket = Ticket::create([
                'publisher_id' => $publisherId,
                'user_id'      => $request->user()->id,
                'subject'      => $request->subject,
                'category'     => $request->category,
                'priority'     => $request->priority,
                'status'       => 'open',
                'last_viewed_by_publisher_at' => now(),
            ]);

            $ticket->messages()->create([
                'user_id'        => $request->user()->id,
                'message'        => $request->message,
                'is_admin_reply' => false,
            ]);

            return $ticket;
        });

        // Send Email Notification to Admin
        try {
            $destEmail = Setting::get('support_email', 'support@bestrevenue.local');
            Mail::to($destEmail)->send(new TicketCreatedAdminMail($ticket, $request->message));
        } catch (\Exception $e) {
            Log::error("Failed to send ticket created email to admin: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Ticket opened successfully.',
            'ticket'  => $ticket->load(['messages.user', 'assignee']),
        ], 201);
    }

    /**
     * GET /api/v1/publisher/tickets/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $publisherId = $request->user()->publisher_id;

        if (!$publisherId) {
            return response()->json(['message' => 'Publisher profile not found.'], 404);
        }

        $ticket = Ticket::where('publisher_id', $publisherId)
            ->with(['messages.user', 'assignee'])
            ->findOrFail($id);

        $ticket->last_viewed_by_publisher_at = now();
        $ticket->save();

        return response()->json($ticket);
    }

    /**
     * POST /api/v1/publisher/tickets/{id}/reply
     */
    public function reply(Request $request, string $id): JsonResponse
    {
        $publisherId = $request->user()->publisher_id;

        if (!$publisherId) {
            return response()->json(['message' => 'Publisher profile not found.'], 404);
        }

        $ticket = Ticket::where('publisher_id', $publisherId)->findOrFail($id);

        if ($ticket->status === 'closed') {
            return response()->json([
                'message' => 'This ticket is closed and cannot be reopened. Please open a new ticket.'
            ], 422);
        }

        $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        $reply = DB::transaction(function () use ($request, $ticket) {
            $message = $ticket->messages()->create([
                'user_id'        => $request->user()->id,
                'message'        => $request->message,
                'is_admin_reply' => false,
            ]);

            // Reopen ticket if it was resolved
            if ($ticket->status === 'resolved') {
                $ticket->status = 'open';
            }
            $ticket->last_viewed_by_publisher_at = now();
            $ticket->touch(); // Update updated_at
            $ticket->save();

            return $message;
        });

        // Send Email Notification to Admin
        try {
            $destEmail = Setting::get('support_email', 'support@bestrevenue.local');
            Mail::to($destEmail)->send(new TicketRepliedAdminMail($ticket, $request->message));
        } catch (\Exception $e) {
            Log::error("Failed to send ticket reply email to admin: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Reply posted successfully.',
            'reply'   => $reply->load('user'),
        ], 201);
    }

    /**
     * POST /api/v1/publisher/tickets/{id}/close
     */
    public function close(Request $request, string $id): JsonResponse
    {
        $publisherId = $request->user()->publisher_id;

        if (!$publisherId) {
            return response()->json(['message' => 'Publisher profile not found.'], 404);
        }

        $ticket = Ticket::where('publisher_id', $publisherId)->findOrFail($id);

        $ticket->status = 'closed';
        $ticket->save();

        return response()->json([
            'message' => 'Ticket closed successfully.',
            'ticket'  => $ticket,
        ]);
    }
}
