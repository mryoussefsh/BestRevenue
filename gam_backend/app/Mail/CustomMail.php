<?php

namespace App\Mail;

use App\Models\Setting;
use App\Services\MailConfigService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CustomMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $customSubject;
    public string $customBody;

    /**
     * Create a new message instance.
     */
    public function __construct(string $subject, string $body)
    {
        $this->customSubject = $subject;
        // Convert plain text newlines to html line breaks and sanitize
        $this->customBody = nl2br(e($body));
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        MailConfigService::applyFromSettings();
        return new Envelope(subject: $this->customSubject);
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $siteLogo = Setting::get('site_logo');
        $siteLogoBase64 = null;
        if ($siteLogo && extension_loaded('gd')) {
            if (str_contains($siteLogo, '/storage/')) {
                $relativePath = explode('/storage/', $siteLogo)[1] ?? null;
                if ($relativePath) {
                    $localPath = storage_path('app/public/' . $relativePath);
                    if (file_exists($localPath)) {
                        $type = strtolower(pathinfo($localPath, PATHINFO_EXTENSION));
                        if ($type === 'jpg') {
                            $type = 'jpeg';
                        }
                        $fileData = @file_get_contents($localPath);
                        if ($fileData) {
                            $siteLogoBase64 = 'data:image/' . $type . ';base64,' . base64_encode($fileData);
                        }
                    }
                }
            }
            if (!$siteLogoBase64) {
                $siteLogoBase64 = $siteLogo;
            }
        } elseif ($siteLogo) {
            $siteLogoBase64 = $siteLogo;
        }

        return new Content(
            view: 'emails.template',
            with: [
                'body'             => $this->customBody,
                'site_name'        => Setting::get('site_name', config('app.name')),
                'site_logo'        => $siteLogoBase64,
                'company_address'  => Setting::get('company_address'),
                'social_facebook'  => Setting::get('social_facebook'),
                'social_instagram' => Setting::get('social_instagram'),
                'social_x'         => Setting::get('social_x'),
                'social_telegram'  => Setting::get('social_telegram'),
                'support_email'    => Setting::get('support_email'),
                'frontend_url'     => config('app.frontend_url', ''),
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
