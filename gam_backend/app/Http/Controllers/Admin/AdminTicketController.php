<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\User;
use App\Mail\TicketRepliedPublisherMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class AdminTicketController extends Controller
{
    /**
     * GET /api/v1/admin/tickets
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ticket::with(['publisher', 'user', 'assignee'])
            ->orderBy('updated_at', 'desc');

        if ($request->filled('publisher_id')) {
            $query->where('publisher_id', $request->publisher_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhereHas('publisher', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $tickets = $query->paginate(15);

        return response()->json($tickets);
    }

    /**
     * GET /api/v1/admin/tickets/admins
     */
    public function getAdmins(): JsonResponse
    {
        $admins = User::where('role', 'admin')
            ->where('is_active', true)
            ->get(['id', 'name', 'email']);

        return response()->json($admins);
    }

    /**
     * GET /api/v1/admin/tickets/{id}
     */
    public function show(string $id): JsonResponse
    {
        $ticket = Ticket::with(['publisher', 'user', 'assignee', 'messages.user'])
            ->findOrFail($id);

        return response()->json($ticket);
    }

    /**
     * PUT /api/v1/admin/tickets/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $ticket = Ticket::findOrFail($id);

        $request->validate([
            'status'      => 'sometimes|string|in:open,in_progress,resolved,closed',
            'priority'    => 'sometimes|string|in:low,medium,high,urgent',
            'category'    => 'sometimes|string|in:billing,technical,gam,other',
            'assigned_to' => 'sometimes|nullable|uuid|exists:users,id',
        ]);

        // If assigning to a user, check that they are an admin
        if ($request->has('assigned_to') && $request->assigned_to !== null) {
            $user = User::findOrFail($request->assigned_to);
            if ($user->role !== 'admin') {
                return response()->json([
                    'message' => 'Tickets can only be assigned to administrator accounts.'
                ], 422);
            }
        }

        $ticket->update($request->only(['status', 'priority', 'category', 'assigned_to']));

        return response()->json([
            'message' => 'Ticket updated successfully.',
            'ticket'  => $ticket->load(['publisher', 'user', 'assignee']),
        ]);
    }

    /**
     * POST /api/v1/admin/tickets/{id}/reply
     */
    public function reply(Request $request, string $id): JsonResponse
    {
        $ticket = Ticket::findOrFail($id);

        if ($ticket->status === 'closed') {
            return response()->json([
                'message' => 'This ticket is closed. Please update the status to reopen and reply.'
            ], 422);
        }

        $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        $reply = DB::transaction(function () use ($request, $ticket) {
            $message = $ticket->messages()->create([
                'user_id'        => $request->user()->id,
                'message'        => $request->message,
                'is_admin_reply' => true,
            ]);

            // Set status to in_progress if it was open
            if ($ticket->status === 'open') {
                $ticket->status = 'in_progress';
            }
            
            // If the ticket has no assignee, automatically assign to this admin
            if (!$ticket->assigned_to) {
                $ticket->assigned_to = $request->user()->id;
            }

            $ticket->touch();
            $ticket->save();

            return $message;
        });

        // Send Email Notification to Publisher
        try {
            if ($ticket->user && $ticket->user->email) {
                Mail::to($ticket->user->email)->send(new TicketRepliedPublisherMail($ticket, $request->message));
            }
        } catch (\Exception $e) {
            Log::error("Failed to send ticket reply email to publisher: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Reply posted successfully.',
            'reply'   => $reply->load('user'),
        ], 201);
    }
}
