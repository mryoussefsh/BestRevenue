<?php

namespace App\Mail;

use App\Models\Ticket;

class TicketCreatedAdminMail extends BaseTemplateMail
{
    protected string $templateKey = 'ticket_created_admin';

    public function __construct(Ticket $ticket, string $messageText)
    {
        $this->variables = [
            'ticket_id'        => $ticket->id,
            'subject'          => $ticket->subject,
            'category'         => ucfirst($ticket->category),
            'priority'         => ucfirst($ticket->priority),
            'message'          => $messageText,
            'publisher_name'   => $ticket->publisher ? $ticket->publisher->name : 'N/A',
            'publisher_email'  => $ticket->user ? $ticket->user->email : 'N/A',
            'site_name'        => config('app.name'),
            'admin_ticket_url' => config('app.frontend_url', 'http://localhost:5173') . '/admin/tickets/' . $ticket->id,
        ];
    }
}
