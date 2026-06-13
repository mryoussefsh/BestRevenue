<?php

use App\Http\Controllers\Admin\GamAccountController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\EmailTemplateController;
use App\Http\Controllers\Admin\AdminTicketController;
use App\Http\Controllers\Publisher\PublisherTicketController;
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
    Route::get('public/pages/{slug}', [\App\Http\Controllers\PublicPageController::class, 'show']);

    // ──────────────────────────────────────────────────────
    // Google OAuth callback (public — Google redirects here)
    // ──────────────────────────────────────────────────────
    Route::get('gam-accounts/oauth/callback', [GamAccountController::class, 'oauthCallback']);

    // ──────────────────────────────────────────────────────
    // Admin routes (auth + role:admin required)
    // ──────────────────────────────────────────────────────
    Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {

        // --- Open to all Admin Users ---
        Route::get('sidebar-stats', [\App\Http\Controllers\Admin\SidebarStatsController::class, 'index']);
        Route::put('profile', [\App\Http\Controllers\Admin\AdminProfileController::class, 'updateProfile']);
        Route::put('change-password', [\App\Http\Controllers\Admin\AdminProfileController::class, 'changePassword']);

        // --- Settings ---
        Route::get('settings', [SettingController::class, 'index']);
        Route::put('settings/{key}', [SettingController::class, 'update']);
        Route::middleware('can:manage_settings')->group(function () {
            Route::post('settings/upload', [SettingController::class, 'uploadSettingFile']);
            Route::post('settings/test-email', [SettingController::class, 'testEmail']);
        });

        // --- Email Templates ---
        Route::middleware('can:manage_email_templates')->group(function () {
            Route::get('email-templates', [EmailTemplateController::class, 'index']);
            Route::put('email-templates/{key}', [EmailTemplateController::class, 'update']);
            Route::post('email-templates/{key}/preview', [EmailTemplateController::class, 'sendPreview']);
            Route::post('email-templates/{key}/reset', [EmailTemplateController::class, 'resetToDefault']);
        });

        // --- Translations ---
        Route::middleware('can:manage_translations')->group(function () {
            Route::get('translations', [TranslationController::class, 'index']);
            Route::put('translations/{locale}/{key}', [TranslationController::class, 'update']);
        });

        // --- Publishers List (Shared index/show access for website/adops/support management) ---
        Route::get('publishers', [\App\Http\Controllers\Admin\PublisherController::class, 'index']);
        Route::get('publishers/{id}', [\App\Http\Controllers\Admin\PublisherController::class, 'show']);
        Route::get('publishers/{id}/ratio-history', [\App\Http\Controllers\Admin\PublisherController::class, 'ratioHistory']);

        // --- Publishers & Adjustments ---
        Route::middleware('can:manage_publishers')->group(function () {
            Route::post('publishers/{id}/set-ratio', [\App\Http\Controllers\Admin\PublisherController::class, 'setRatio']);
            Route::post('publishers/{id}/suspend', [\App\Http\Controllers\Admin\PublisherController::class, 'suspend']);
            Route::post('publishers/{id}/activate', [\App\Http\Controllers\Admin\PublisherController::class, 'activate']);
            Route::post('publishers/{id}/adjust-balance', [\App\Http\Controllers\Admin\PublisherController::class, 'adjustBalance']);
            Route::post('publishers/{id}/impersonate', [\App\Http\Controllers\Admin\PublisherController::class, 'impersonate']);
            Route::apiResource('publishers', \App\Http\Controllers\Admin\PublisherController::class)->except(['index', 'show']);
            Route::post('adjustments/apply-ivt', [\App\Http\Controllers\Admin\AdjustmentController::class, 'applyIvt']);
            Route::post('adjustments/apply-bonus', [\App\Http\Controllers\Admin\AdjustmentController::class, 'applyBonus']);
            Route::apiResource('adjustments', \App\Http\Controllers\Admin\AdjustmentController::class);
        });

        // --- Websites ---
        Route::middleware('can:manage_websites')->group(function () {
            Route::apiResource('websites', \App\Http\Controllers\Admin\WebsiteController::class);
        });

        // --- Ad Units ---
        Route::middleware('can:manage_ad_units')->group(function () {
            Route::post('websites/ad-units/create-in-gam', [\App\Http\Controllers\Admin\AdUnitController::class, 'createInGam']);
            Route::post('websites/ad-units/bulk-create',   [\App\Http\Controllers\Admin\AdUnitController::class, 'bulkCreate']);
            Route::post('ad-units/bulk-delete', [\App\Http\Controllers\Admin\AdUnitController::class, 'bulkDelete']);
            Route::apiResource('ad-units', \App\Http\Controllers\Admin\AdUnitController::class);
        });

        // --- Revenue ---
        Route::middleware('can:manage_revenue')->group(function () {
            Route::delete('revenue/wipe', [\App\Http\Controllers\Admin\RevenueController::class, 'wipe']);
            Route::get('revenue', [\App\Http\Controllers\Admin\RevenueController::class, 'index']);
        });

        // --- Period Closings ---
        Route::middleware('can:manage_closings')->group(function () {
            Route::get('period-closings', [\App\Http\Controllers\Admin\PeriodClosingController::class, 'index']);
            Route::post('period-closings/close', [\App\Http\Controllers\Admin\PeriodClosingController::class, 'close']);
            Route::get('period-closings/stuck', [\App\Http\Controllers\Admin\PeriodClosingController::class, 'listStuck']);
            Route::post('period-closings/{id}/recover-abort',    [\App\Http\Controllers\Admin\PeriodClosingController::class, 'recoverAbort']);
            Route::post('period-closings/{id}/recover-complete', [\App\Http\Controllers\Admin\PeriodClosingController::class, 'recoverComplete']);
            Route::get('period-closings/{id}', [\App\Http\Controllers\Admin\PeriodClosingController::class, 'show']);
            Route::delete('period-closings/{id}', [\App\Http\Controllers\Admin\PeriodClosingController::class, 'destroy']);
        });

        // --- Payouts (Period Closing & Standalone overrides) ---
        Route::middleware('can:manage_payouts')->group(function () {
            Route::post('publishers/{id}/create-payout', [\App\Http\Controllers\Admin\PublisherController::class, 'createPayout']);
            Route::post('publishers/{id}/manual-payment', [\App\Http\Controllers\Admin\PublisherController::class, 'manualPayment']);
            Route::get('payouts', [\App\Http\Controllers\Admin\PayoutController::class, 'index']);
            Route::post('payouts/{id}/approve', [\App\Http\Controllers\Admin\PayoutController::class, 'approve']);
            Route::post('payouts/{id}/reject', [\App\Http\Controllers\Admin\PayoutController::class, 'reject']);
            Route::post('payouts/{id}/mark-paid', [\App\Http\Controllers\Admin\PayoutController::class, 'markPaid']);
        });

        // --- GAM Accounts ---
        Route::middleware('can:manage_gam_accounts')->group(function () {
            Route::get('gam-accounts',                   [GamAccountController::class, 'index']);
            Route::post('gam-accounts/sync',             [GamAccountController::class, 'triggerSync']);
            Route::get('gam-accounts/sync-logs',         [GamAccountController::class, 'syncLogs']);
            Route::get('gam-accounts/sync-log',          [GamAccountController::class, 'syncLogs']);
            Route::get('gam-accounts/oauth/url',         [GamAccountController::class, 'oauthUrl']);
            Route::post('gam-accounts',                  [GamAccountController::class, 'store']);
            Route::put('gam-accounts/{id}',              [GamAccountController::class, 'update']);
            Route::delete('gam-accounts/{id}',           [GamAccountController::class, 'destroy']);
            Route::post('gam-accounts/{id}/refresh-token', [GamAccountController::class, 'refreshToken']);
        });

        // --- Announcements ---
        Route::middleware('can:manage_announcements')->group(function () {
            Route::apiResource('announcements', \App\Http\Controllers\Admin\AnnouncementController::class);
        });

        // --- Pages ---
        Route::middleware('can:manage_pages')->group(function () {
            Route::apiResource('pages', \App\Http\Controllers\Admin\PageController::class);
        });

        // --- Support Tickets ---
        Route::middleware('can:manage_tickets')->group(function () {
            Route::get('tickets/admins', [AdminTicketController::class, 'getAdmins']);
            Route::get('tickets',        [AdminTicketController::class, 'index']);
            Route::get('tickets/{id}',   [AdminTicketController::class, 'show']);
            Route::put('tickets/{id}',   [AdminTicketController::class, 'update']);
            Route::post('tickets/{id}/reply', [AdminTicketController::class, 'reply']);
        });

        // --- Admin Management (Super Admin only) ---
        Route::middleware('can:manage_admins')->group(function () {
            Route::get('audit-logs', [\App\Http\Controllers\Admin\AuditLogController::class, 'index']);
            Route::get('permissions', [\App\Http\Controllers\Admin\PermissionsController::class, 'index']);
            Route::apiResource('admins', \App\Http\Controllers\Admin\AdminManagementController::class);
            Route::apiResource('roles', \App\Http\Controllers\Admin\RolesController::class);
        });

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

        // Tickets
        Route::get('tickets',        [PublisherTicketController::class, 'index']);
        Route::post('tickets',       [PublisherTicketController::class, 'store']);
        Route::get('tickets/{id}',   [PublisherTicketController::class, 'show']);
        Route::post('tickets/{id}/reply', [PublisherTicketController::class, 'reply']);
        Route::post('tickets/{id}/close', [PublisherTicketController::class, 'close']);
    });
});
