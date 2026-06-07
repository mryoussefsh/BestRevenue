<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingController extends Controller
{
    /**
     * GET /api/v1/admin/settings
     * Returns all settings grouped by group key.
     */
    public function index(): JsonResponse
    {
        $settings = Setting::orderBy('group')->orderBy('key')->get()->map(function ($setting) {
            return [
                'key'   => $setting->key,
                'value' => $setting->value,
                'label' => $setting->label,
                'type'  => $setting->type,
                'group' => $setting->group,
            ];
        })->toArray();

        // FIX [NEW-09]: Removed 'project_path' entry — base_path() exposes the full
        // server filesystem path to any admin user, which is a path disclosure risk.

        return response()->json($settings);
    }

    /**
     * PUT /api/v1/admin/settings/{key}
     * Update a single setting value.
     */
    public function update(Request $request, string $key): JsonResponse
    {
        $setting = Setting::findOrFail($key);

        $request->validate([
            'value' => 'required',
        ]);

        $value = $request->value;

        $oldValue = $setting->value;

        // Validate specific settings
        if ($key === 'payout_day') {
            $request->validate(['value' => 'integer|min:1|max:28']);
        }

        if ($key === 'close_period_day') {
            $request->validate(['value' => 'integer|min:1|max:28']);
        }

        if ($key === 'approve_earnings_day') {
            $request->validate(['value' => 'integer|min:1|max:28']);
        }

        if ($key === 'payout_threshold') {
            $request->validate(['value' => 'numeric|min:0']);
        }

        if ($key === 'gam_sync_frequency') {
            $request->validate(['value' => 'required|in:daily,hourly,minutes']);
        }

        if ($key === 'gam_sync_interval') {
            $request->validate(['value' => 'required|integer|min:1']);
        }

        if ($key === 'publisher_registration_status') {
            $request->validate(['value' => 'required|in:active,pending']);
        }

        if ($key === 'publisher_pending_message') {
            $request->validate(['value' => 'required|string|max:1000']);
        }

        if ($key === 'publisher_default_ratio') {
            $request->validate(['value' => 'required|numeric|min:1|max:100']);
        }

        if ($key === 'mail_mailer') {
            $request->validate(['value' => 'required|in:smtp,log']);
        }

        if ($key === 'mail_port') {
            $request->validate(['value' => 'required|integer|min:1']);
        }

        if ($key === 'mail_encryption') {
            $request->validate(['value' => 'required|in:tls,ssl,none']);
        }

        if ($key === 'mail_from_address') {
            $request->validate(['value' => 'required|email']);
        }

        $setting->value = is_array($value) ? json_encode($value) : $value;
        $setting->updated_at = now();
        $setting->save();

        // FIX [NEW-04]: SettingController was bypassing Setting::set() and calling save()
        // directly, which skipped the Cache::forget() call added in FIX-24.
        // After save, explicitly invalidate the cache so reads immediately reflect the new value.
        Cache::forget("setting_{$key}");

        if ($oldValue != $setting->value) {
            \App\Services\AuditLogService::log('updated', 'Setting', $setting->key, ['value' => $oldValue], ['value' => $setting->value]);
        }

        return response()->json([
            'message' => 'Setting updated successfully.',
            'key'     => $setting->key,
            'value'   => $setting->value,
        ]);
    }

    /**
     * POST /api/v1/admin/settings/test-email
     * Send a plain text test email using configured SMTP settings.
     */
    public function testEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $recipient = $request->email;
        $siteName = config('app.name', 'BestRevenue');

        try {
            \App\Services\MailConfigService::applyFromSettings();

            \Illuminate\Support\Facades\Mail::raw("This is a test email from {$siteName} confirming that your SMTP/email settings are correctly configured.", function ($msg) use ($recipient, $siteName) {
                $msg->to($recipient)->subject("Test Email from {$siteName}");
            });

            return response()->json(['message' => "Test email sent successfully to {$recipient}."]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send test email: ' . $e->getMessage()], 500);
        }
    }
}
