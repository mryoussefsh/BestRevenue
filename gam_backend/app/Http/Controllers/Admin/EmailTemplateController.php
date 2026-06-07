<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use App\Services\MailConfigService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class EmailTemplateController extends Controller
{
    /**
     * GET /api/v1/admin/email-templates
     * Return all templates (DB rows + defaults for missing keys).
     */
    public function index(): JsonResponse
    {
        $allKeys = EmailTemplate::allKeys();
        $dbRows  = EmailTemplate::all()->keyBy('key');

        $templates = [];
        foreach ($allKeys as $key => $label) {
            $default = EmailTemplate::defaults($key);
            $db      = $dbRows->get($key);

            $templates[] = [
                'key'             => $key,
                'label'           => $label,
                'subject'         => $db ? $db->subject : $default['subject'],
                'body'            => $db ? $db->body    : $default['body'],
                'is_customized'   => (bool) $db,
                'default_subject' => $default['subject'],
                'default_body'    => $default['body'],
            ];
        }

        return response()->json($templates);
    }

    /**
     * PUT /api/v1/admin/email-templates/{key}
     * Save custom subject + body for a template.
     */
    public function update(Request $request, string $key): JsonResponse
    {
        $allKeys = EmailTemplate::allKeys();
        if (!array_key_exists($key, $allKeys)) {
            return response()->json(['message' => 'Unknown template key.'], 404);
        }

        $request->validate([
            'subject' => 'required|string|max:500',
            'body'    => 'required|string',
        ]);

        $template = EmailTemplate::updateOrCreate(
            ['key' => $key],
            [
                'label'   => $allKeys[$key],
                'subject' => $request->subject,
                'body'    => $request->body,
            ]
        );

        return response()->json([
            'message'  => 'Template saved successfully.',
            'template' => $template,
        ]);
    }

    /**
     * POST /api/v1/admin/email-templates/{key}/reset
     * Reset template to hardcoded default (delete DB row).
     */
    public function resetToDefault(string $key): JsonResponse
    {
        $allKeys = EmailTemplate::allKeys();
        if (!array_key_exists($key, $allKeys)) {
            return response()->json(['message' => 'Unknown template key.'], 404);
        }

        EmailTemplate::where('key', $key)->delete();
        $default = EmailTemplate::defaults($key);

        return response()->json([
            'message'         => 'Template reset to default.',
            'default_subject' => $default['subject'],
            'default_body'    => $default['body'],
        ]);
    }

    /**
     * POST /api/v1/admin/email-templates/{key}/preview
     * Send a test email using this template to the authenticated admin's email.
     */
    public function sendPreview(Request $request, string $key): JsonResponse
    {
        $allKeys = EmailTemplate::allKeys();
        if (!array_key_exists($key, $allKeys)) {
            return response()->json(['message' => 'Unknown template key.'], 404);
        }

        $adminEmail = $request->user()->email;
        $adminName  = $request->user()->name;

        // Render preview with sample variables
        $template = EmailTemplate::getTemplate($key);
        $sampleVars = [
            'name'              => $adminName,
            'email'             => $adminEmail,
            'site_name'         => config('app.name'),
            'period'            => date('Y-m'),
            'amount'            => '$250.00',
            'payment_method'    => 'PayPal',
            'payment_reference' => 'TXN-PREVIEW-123',
            'admin_note'        => 'This is a sample rejection reason.',
            'reset_link'        => config('app.frontend_url', 'http://localhost:5173') . '/reset-password?token=PREVIEW_TOKEN',
            'login_url'         => config('app.frontend_url', 'http://localhost:5173') . '/login',
            'dashboard_url'     => config('app.frontend_url', 'http://localhost:5173') . '/publisher',
        ];

        $subject  = EmailTemplate::render($template['subject'], $sampleVars);
        $body     = EmailTemplate::render($template['body'], $sampleVars);
        $siteName = config('app.name');

        try {
            MailConfigService::applyFromSettings();

            Mail::send('emails.template', ['body' => $body, 'site_name' => $siteName], function ($msg) use ($adminEmail, $adminName, $subject) {
                $msg->to($adminEmail, $adminName)->subject('[PREVIEW] ' . $subject);
            });

            return response()->json(['message' => "Preview sent to {$adminEmail} successfully."]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send preview: ' . $e->getMessage()], 500);
        }
    }
}
