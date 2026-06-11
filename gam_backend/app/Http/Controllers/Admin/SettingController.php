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
        $settings = Setting::whereNotIn('key', ['default_currency', 'gam_timezone', 'payout_day'])
            ->orderBy('group')
            ->orderBy('key')
            ->get()
            ->map(function ($setting) {
                return [
                    'key'   => $setting->key,
                    'value' => $setting->value,
                    'label' => $setting->label,
                    'type'  => $setting->type,
                    'group' => $setting->group,
                ];
            })->toArray();

        // Restore project_path securely under system_info group for administrator setup instructions
        $settings[] = [
            'key'   => 'project_path',
            'value' => base_path(),
            'label' => 'Project Path',
            'type'  => 'string',
            'group' => 'system_info',
        ];

        return response()->json($settings);
    }

    /**
     * PUT /api/v1/admin/settings/{key}
     * Update a single setting value.
     */
    public function update(Request $request, string $key): JsonResponse
    {
        $setting = Setting::findOrFail($key);

        // Allow certain settings to be cleared (nullable)
        $nullableKeys = ['site_logo', 'site_favicon', 'og_image', 'support_telegram', 'support_whatsapp', 'social_facebook', 'social_instagram', 'social_x', 'social_telegram'];
        $isRequired = !in_array($key, $nullableKeys);

        $request->validate([
            'value' => $isRequired ? 'required' : 'nullable',
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

        if ($key === 'ad_type_preselected_sizes') {
            $request->validate(['value' => 'required|array']);
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

            $relevantKeys = ['close_period_day', 'payout_auto_enabled', 'approve_earnings_day'];
            if (in_array($key, $relevantKeys)) {
                if (filter_var(Setting::get('payout_auto_enabled', true), FILTER_VALIDATE_BOOLEAN)) {
                    try {
                        \Illuminate\Support\Facades\Artisan::call('period:auto-close');
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error('Auto-close execution failed on settings update: ' . $e->getMessage());
                    }
                }
            }
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

    /**
     * GET /api/v1/public/settings
     */
    public function getPublicSettings(): JsonResponse
    {
        $publicKeys = [
            'site_name',
            'site_description',
            'site_logo',
            'site_favicon',
            'og_image',
            'meta_title',
            'meta_description',
            'meta_keywords',
            'registration_status',
            'publisher_registration_status',
            'publisher_pending_message',
            'payment_methods',
            'platform_timezone',
            'ad_type_preselected_sizes',
            'support_email',
            'support_telegram',
            'support_whatsapp',
            'social_facebook',
            'social_instagram',
            'social_x',
            'social_telegram',
        ];

        $settings = Setting::whereIn('key', $publicKeys)->get()->map(function ($setting) {
            $value = $setting->value;
            if ($setting->type === 'json' && $value) {
                $decoded = json_decode($value, true);
                $value = is_array($decoded) ? $decoded : $value;
            }
            return [
                'key'   => $setting->key,
                'value' => $value,
                'type'  => $setting->type,
            ];
        });

        // Convert key-value pair format to list or return object
        $map = [];
        foreach ($settings as $s) {
            $map[$s['key']] = $s['value'];
        }

        // Add dynamic stats from the database
        $map['stats_publishers'] = \App\Models\Publisher::where('status', 'active')->count();
        $map['stats_websites'] = \App\Models\Website::where('is_active', true)->count();
        $map['stats_total_paid'] = (float) \App\Models\Payout::where('status', 'paid')->sum('final_amount');
        $map['stats_impressions'] = (int) \App\Models\RevenueRecord::sum('impressions');

        // Dynamic recent payouts (proofs)
        $realPayouts = \App\Models\Payout::where('status', 'paid')
            ->with('publisher')
            ->latest('paid_at')
            ->latest('created_at')
            ->take(10)
            ->get()
            ->map(function ($payout) {
                $pubName = $payout->publisher ? $payout->publisher->name : 'Publisher';
                return [
                    'id' => $payout->id,
                    'publisher' => self::maskName($pubName),
                    'amount' => (float) $payout->final_amount,
                    'date' => $payout->paid_at ? $payout->paid_at->format('n/j/Y') : ($payout->created_at ? $payout->created_at->format('n/j/Y') : now()->format('n/j/Y')),
                    'ref' => $payout->payment_reference ?: 'N/A',
                    'method' => $payout->payment_method ?: 'N/A',
                ];
            });

        // Fallback mock payouts if none exist in the database yet
        if ($realPayouts->isEmpty()) {
            $realPayouts = collect([
                ['id' => 'PAY-1', 'publisher' => 'H*** A***', 'amount' => 297.28, 'date' => '5/24/2026', 'ref' => 'WT-FED-8492048', 'method' => 'Wire Transfer'],
                ['id' => 'PAY-2', 'publisher' => 'Y*** S***', 'amount' => 180.72, 'date' => '5/24/2026', 'ref' => '0x8fa92...e1a49f', 'method' => 'USDT (ERC-20)'],
                ['id' => 'PAY-3', 'publisher' => 'Y*** S***', 'amount' => 30.91, 'date' => '5/24/2026', 'ref' => 'PP-REF-6582910', 'method' => 'PayPal'],
                ['id' => 'PAY-4', 'publisher' => 'S*** m***', 'amount' => 57.00, 'date' => '4/23/2026', 'ref' => 'WT-SIB-9283741', 'method' => 'Wire Transfer'],
                ['id' => 'PAY-5', 'publisher' => 'Y*** M***', 'amount' => 10.00, 'date' => '4/22/2026', 'ref' => 'TKh82fs...9d2ka', 'method' => 'USDC (TRC-20)'],
                ['id' => 'PAY-6', 'publisher' => 's*** l***', 'amount' => 54.00, 'date' => '4/22/2026', 'ref' => 'WT-CH-918237', 'method' => 'Wire Transfer'],
                ['id' => 'PAY-7', 'publisher' => 'H*** A***', 'amount' => 18.30, 'date' => '4/22/2026', 'ref' => 'PP-REF-819284', 'method' => 'PayPal'],
            ]);
        }

        $map['recent_payouts'] = $realPayouts;

        // Dynamic active pages
        $map['pages'] = \App\Models\Page::where('is_active', true)
            ->select(['id', 'title', 'slug', 'show_in_public_footer', 'show_in_publisher_footer', 'show_in_landing_menu'])
            ->get();

        return response()->json($map);
    }

    /**
     * Mask name for privacy (e.g. H*** A***)
     */
    private static function maskName(string $name): string
    {
        $parts = explode(' ', trim($name));
        $masked = [];
        foreach ($parts as $part) {
            if ($part) {
                $masked[] = mb_substr($part, 0, 1) . '***';
            }
        }
        if (count($masked) === 1) {
            return $masked[0];
        }
        return implode(' ', array_slice($masked, 0, 2));
    }

    /**
     * POST /api/v1/admin/settings/upload
     */
    public function uploadSettingFile(Request $request): JsonResponse
    {
        $request->validate([
            'key'  => 'required|string|in:site_logo,site_favicon,og_image',
            'file' => 'required|file|image|mimes:jpeg,png,jpg,gif,svg,ico|max:2048',
        ]);

        $key = $request->key;
        $file = $request->file('file');

        $path = $file->store('settings', 'public');
        $url = asset('storage/' . $path);

        $setting = Setting::findOrFail($key);
        $oldValue = $setting->value;

        $setting->value = $url;
        $setting->updated_at = now();
        $setting->save();

        Cache::forget("setting_{$key}");

        \App\Services\AuditLogService::log('updated', 'Setting', $key, ['value' => $oldValue], ['value' => $url]);

        return response()->json([
            'message' => 'File uploaded and setting updated successfully.',
            'key'     => $key,
            'value'   => $url,
        ]);
    }
}
