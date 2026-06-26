<?php

namespace App\Mail;

use App\Models\EmailTemplate;
use App\Models\Setting;
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

        // Inject dynamic site name from settings into variables
        $this->variables['site_name'] = Setting::get('site_name', config('app.name'));

        $template  = EmailTemplate::getTemplate($this->templateKey);
        $subject   = EmailTemplate::render($template['subject'], $this->variables);

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        // Inject dynamic site name from settings into variables (in case content is called directly without envelope)
        $this->variables['site_name'] = Setting::get('site_name', config('app.name'));

        $template = EmailTemplate::getTemplate($this->templateKey);
        $body     = EmailTemplate::render($template['body'], $this->variables);

        // Resolve logo — try to embed as base64 for email clients, fall back to direct URL
        $logoUrl        = Setting::get('site_logo');
        $siteLogoBase64 = null;
        if ($logoUrl && extension_loaded('gd')) {
            if (str_contains($logoUrl, '/storage/')) {
                $relativePath = explode('/storage/', $logoUrl)[1] ?? null;
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
                $siteLogoBase64 = $logoUrl;
            }
        } elseif ($logoUrl) {
            $siteLogoBase64 = $logoUrl;
        }

        return new Content(
            view: 'emails.template',
            with: [
                'body'             => $body,
                'site_name'        => $this->variables['site_name'],
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

    public function attachments(): array
    {
        return [];
    }
}
