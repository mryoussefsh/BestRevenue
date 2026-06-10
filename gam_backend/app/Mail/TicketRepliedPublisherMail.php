<?php

namespace App\Mail;

use App\Models\Ticket;

class TicketRepliedPublisherMail extends BaseTemplateMail
{
    protected string $templateKey = 'ticket_replied_publisher';

    public function __construct(Ticket $ticket, string $replyText)
    {
        $this->variables = [
            'ticket_id'            => $ticket->id,
            'subject'              => $ticket->subject,
            'name'                 => $ticket->user ? $ticket->user->name : 'Publisher',
            'message'              => $replyText,
            'site_name'            => config('app.name'),
            'publisher_ticket_url' => config('app.frontend_url', 'http://localhost:5173') . '/publisher/tickets/' . $ticket->id,
        ];
    }
}
