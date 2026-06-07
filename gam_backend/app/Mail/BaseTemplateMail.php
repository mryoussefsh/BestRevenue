<?php

namespace App\Mail;

use App\Models\EmailTemplate;
use App\Services\MailConfigService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

abstract class BaseTemplateMail extends Mailable
{
    use Queueable, SerializesModels;

    protected string $templateKey;
    protected array $variables = [];

    /**
     * Apply DB mail settings and return envelope.
     */
    public function envelope(): Envelope
    {
        MailConfigService::applyFromSettings();

        $template  = EmailTemplate::getTemplate($this->templateKey);
        $subject   = EmailTemplate::render($template['subject'], $this->variables);

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        $template = EmailTemplate::getTemplate($this->templateKey);
        $body     = EmailTemplate::render($template['body'], $this->variables);

        return new Content(
            view: 'emails.template',
            with: [
                'body'      => $body,
                'site_name' => config('app.name'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
