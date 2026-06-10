<?php

use App\Http\Controllers\Admin\GamAccountController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\EmailTemplateController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\TranslationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — GAM Revenue Sharing Platform
|--------------------------------------------------------------------------
| Prefix: /api/v1/
| Auth: Laravel Sanctum (Bearer token)
| Role enforcement: 'role:admin' / 'role:publisher' middleware
*/

Route::prefix('v1')->group(function () {

    // ──────────────────────────────────────────────────────
    // Auth (public)
    // ──────────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        // FIX [SEC-1, A-1, PR-1]: Apply rate limiting to all public auth endpoints.
        // Login: 5 attempts per minute (brute-force protection)
        Route::post('login',           [AuthController::class, 'login'])->middleware('throttle:5,1');
        // Register: 3 accounts per 60 minutes (bot registration protection)
        Route::post('register',        [RegisterController::class, 'register'])->middleware('throttle:3,60');
        // Forgot password: 3 requests per 30 minutes (email spam protection)
        Route::post('forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:3,30');
        // Reset password: 5 attempts per minute
        Route::post('reset-password',  [PasswordResetController::class, 'reset'])->middleware('throttle:5,1');
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me',      [AuthController::class, 'me']);
        });
    });

    // ──────────────────────────────────────────────────────
    // Translations (public GET — used by React i18n)
    // ──────────────────────────────────────────────────────
    Route::get('translations/{locale}', [TranslationController::class, 'show']);
    Route::get('public/settings', [SettingController::class, 'getPublicSettings']);
    Route::post('public/contact', [\App\Http\Controllers\ContactController::class, 'submit'])->middleware('throttle:5,1');

    // ──────────────────────────────────────────────────────
    // Google OAuth callback (public — Google redirects here)
    // ──────────────────────────────────────────────────────
    Route::get('gam-accounts/oauth/callback', [GamAccountController::class, 'oauthCallback']);

    // ──────────────────────────────────────────────────────
    // Admin routes (auth + role:admin required)
    // ──────────────────────────────────────────────────────
    Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {

        // Settings
        Route::get('settings', [SettingController::class, 'index']);
        Route::put('settings/{key}', [SettingController::class, 'update']);
        Route::post('settings/upload', [SettingController::class, 'uploadSettingFile']);
        Route::post('settings/test-email', [SettingController::class, 'testEmail']);

        // Email Templates
        Route::get('email-templates', [EmailTemplateController::class, 'index']);
        Route::put('email-templates/{key}', [EmailTemplateController::class, 'update']);
        Route::post('email-templates/{key}/preview', [EmailTemplateController::class, 'sendPreview']);
        Route::post('email-templates/{key}/reset', [EmailTemplateController::class, 'resetToDefault']);

        // Translations (admin edit)
        Route::get('translations', [TranslationController::class, 'index']);
        Route::put('translations/{locale}/{key}', [TranslationController::class, 'update']);

        // Sidebar Stats
        Route::get('sidebar-stats', [\App\Http\Controllers\Admin\SidebarStatsController::class, 'index']);

        // Publishers — Sprint 2
        Route::post('publishers/{id}/set-ratio', [\App\Http\Controllers\Admin\PublisherController::class, 'setRatio']);
        Route::get('publishers/{id}/ratio-history', [\App\Http\Controllers\Admin\PublisherController::class, 'ratioHistory']);
        Route::post('publishers/{id}/suspend', [\App\Http\Controllers\Admin\PublisherController::class, 'suspend']);
        Route::post('publishers/{id}/activate', [\App\Http\Controllers\Admin\PublisherController::class, 'activate']);
        Route::post('publishers/{id}/adjust-balance', [\App\Http\Controllers\Admin\PublisherController::class, 'adjustBalance']);
        Route::post('publishers/{id}/impersonate', [\App\Http\Controllers\Admin\PublisherController::class, 'impersonate']);
        // REFACTOR [MPAY-1]: Hardened admin payout override (requires existing closed PeriodClosing)
        Route::post('publishers/{id}/create-payout', [\App\Http\Controllers\Admin\PublisherController::class, 'createPayout']);
        // REFACTOR [MPAY-1]: Standalone manual payment — no Period Closing involvement
        Route::post('publishers/{id}/manual-payment', [\App\Http\Controllers\Admin\PublisherController::class, 'manualPayment']);
        Route::apiResource('publishers', \App\Http\Controllers\Admin\PublisherController::class);
        Route::post('adjustments/apply-ivt', [\App\Http\Controllers\Admin\AdjustmentController::class, 'applyIvt']);
        Route::post('adjustments/apply-bonus', [\App\Http\Controllers\Admin\AdjustmentController::class, 'applyBonus']);
        Route::apiResource('adjustments', \App\Http\Controllers\Admin\AdjustmentController::class);

        // Websites & Ad Units — Sprint 3
        Route::post('websites/ad-units/create-in-gam', [\App\Http\Controllers\Admin\AdUnitController::class, 'createInGam']);
        Route::post('websites/ad-units/bulk-create',   [\App\Http\Controllers\Admin\AdUnitController::class, 'bulkCreate']);
        Route::apiResource('websites', \App\Http\Controllers\Admin\WebsiteController::class);
        Route::post('ad-units/bulk-delete', [\App\Http\Controllers\Admin\AdUnitController::class, 'bulkDelete']);
        Route::apiResource('ad-units', \App\Http\Controllers\Admin\AdUnitController::class);

        // Revenue
        Route::delete('revenue/wipe', [\App\Http\Controllers\Admin\RevenueController::class, 'wipe']);
        Route::get('revenue', [\App\Http\Controllers\Admin\RevenueController::class, 'index']);

        // Period Closings — Sprint 5
        Route::get('period-closings', [\App\Http\Controllers\Admin\PeriodClosingController::class, 'index']);
        Route::post('period-closings/close', [\App\Http\Controllers\Admin\PeriodClosingController::class, 'close']);
        // FIX [PC-2]: Recovery endpoints for stuck 'closing' state periods
        Route::get('period-closings/stuck', [\App\Http\Controllers\Admin\PeriodClosingController::class, 'listStuck']);
        Route::post('period-closings/{id}/recover-abort',    [\App\Http\Controllers\Admin\PeriodClosingController::class, 'recoverAbort']);
        Route::post('period-closings/{id}/recover-complete', [\App\Http\Controllers\Admin\PeriodClosingController::class, 'recoverComplete']);
        Route::get('period-closings/{id}', [\App\Http\Controllers\Admin\PeriodClosingController::class, 'show']);
        Route::delete('period-closings/{id}', [\App\Http\Controllers\Admin\PeriodClosingController::class, 'destroy']);

        // Payouts — Sprint 5
        Route::get('payouts', [\App\Http\Controllers\Admin\PayoutController::class, 'index']);
        Route::post('payouts/{id}/approve', [\App\Http\Controllers\Admin\PayoutController::class, 'approve']);
        Route::post('payouts/{id}/reject', [\App\Http\Controllers\Admin\PayoutController::class, 'reject']);
        Route::post('payouts/{id}/mark-paid', [\App\Http\Controllers\Admin\PayoutController::class, 'markPaid']);

        // Audit Logs — Sprint 9
        Route::get('audit-logs', [\App\Http\Controllers\Admin\AuditLogController::class, 'index']);

        // GAM Accounts — Multi-account management
        Route::get('gam-accounts',                   [GamAccountController::class, 'index']);
        Route::post('gam-accounts/sync',             [GamAccountController::class, 'triggerSync']);
        Route::get('gam-accounts/sync-logs',         [GamAccountController::class, 'syncLogs']);
        Route::get('gam-accounts/sync-log',          [GamAccountController::class, 'syncLogs']);
        Route::get('gam-accounts/oauth/url',         [GamAccountController::class, 'oauthUrl']);
        Route::post('gam-accounts',                  [GamAccountController::class, 'store']);
        Route::put('gam-accounts/{id}',              [GamAccountController::class, 'update']);
        Route::delete('gam-accounts/{id}',           [GamAccountController::class, 'destroy']);
        Route::post('gam-accounts/{id}/refresh-token', [GamAccountController::class, 'refreshToken']);

        // Announcements
        Route::apiResource('announcements', \App\Http\Controllers\Admin\AnnouncementController::class);

    });

    // ──────────────────────────────────────────────────────
    // Publisher routes (auth + role:publisher required)
    // ──────────────────────────────────────────────────────
    Route::middleware(['auth:sanctum', 'role:publisher'])->prefix('publisher')->group(function () {

        // Dashboard — Sprint 6
        // Route::get('dashboard', [DashboardController::class, 'index']);

        // Websites & Ad Units — Sprint 3
        Route::get('websites', [\App\Http\Controllers\Publisher\PublisherWebsiteController::class, 'index']);
        Route::get('websites/{id}/ad-units', [\App\Http\Controllers\Publisher\PublisherWebsiteController::class, 'adUnits']);

        // Revenue — Sprint 6
        Route::get('revenue', [\App\Http\Controllers\Publisher\PublisherRevenueController::class, 'index']);
        Route::get('revenue/pdf', [\App\Http\Controllers\Publisher\PublisherRevenueController::class, 'exportPdf']);

        // Payouts — Sprint 6
        Route::get('payouts', [\App\Http\Controllers\Publisher\PublisherPayoutController::class, 'index']);
        Route::put('payment-info', [\App\Http\Controllers\Publisher\PublisherPayoutController::class, 'updatePaymentInfo']);
        Route::put('profile', [\App\Http\Controllers\Publisher\PublisherSettingsController::class, 'updateProfile']);
        Route::put('change-password', [\App\Http\Controllers\Publisher\PublisherSettingsController::class, 'changePassword']);

        // Announcements
        Route::get('announcements', [\App\Http\Controllers\Publisher\AnnouncementController::class, 'index']);
        Route::post('announcements/{id}/interact', [\App\Http\Controllers\Publisher\AnnouncementController::class, 'interact']);
    });
});
