<?php

namespace App\Mail;

use App\Models\Ticket;

class TicketRepliedAdminMail extends BaseTemplateMail
{
    protected string $templateKey = 'ticket_replied_admin';

    public function __construct(Ticket $ticket, string $replyText)
    {
        $this->variables = [
            'ticket_id'        => $ticket->id,
            'subject'          => $ticket->subject,
            'publisher_name'   => $ticket->publisher ? $ticket->publisher->name : 'N/A',
            'message'          => $replyText,
            'site_name'        => config('app.name'),
            'admin_ticket_url' => config('app.frontend_url', 'http://localhost:5173') . '/admin/tickets/' . $ticket->id,
        ];
    }
}
