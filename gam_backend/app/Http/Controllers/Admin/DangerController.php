<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\GamAccount;
use App\Models\AuditLog;
use App\Models\RevenueRecord;
use App\Models\GamSyncLog;
use App\Models\PeriodClosing;
use App\Models\TrafficHourlyStat;
use App\Models\TrafficDailyStat;
use App\Models\TrafficQualityScore;
use App\Models\TrafficAnomaly;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DangerController extends Controller
{
    /**
     * POST /api/v1/admin/danger/wipe-revenue
     * Centralized action to delete all revenue records and sync logs.
     */
    public function wipeRevenue(Request $request): JsonResponse
    {
        $confirm = $request->input('confirm');
        if ($confirm !== 'WIPE') {
            return response()->json(['message' => 'This action requires explicit confirmation. Please pass confirm=WIPE.'], 422);
        }

        // Safety Guard: Block if any closed periods exist
        $closedPeriodCount = PeriodClosing::where('status', 'closed')->count();
        if ($closedPeriodCount > 0) {
            return response()->json([
                'message' => "Cannot wipe revenue data: {$closedPeriodCount} closed period(s) exist. Wiping would corrupt financial history.",
            ], 422);
        }

        $totalRecords = RevenueRecord::count();
        $totalSyncLogs = GamSyncLog::count();

        // Audit before execution
        AuditLogService::log(
            'revenue_wipe',
            'RevenueRecord',
            null,
            ['revenue_records_count' => $totalRecords, 'sync_logs_count' => $totalSyncLogs],
            ['action' => 'TRUNCATE ALL', 'requested_by_ip' => $request->ip(), 'confirm_token_provided' => true]
        );

        RevenueRecord::truncate();
        GamSyncLog::truncate();
        RevenueRecord::clearCache();

        return response()->json([
            'message' => 'All revenue records and sync logs have been permanently deleted.',
            'records_deleted' => $totalRecords,
            'sync_logs_deleted' => $totalSyncLogs,
        ]);
    }

    /**
     * POST /api/v1/admin/danger/wipe-audit-logs
     * Destructive action to wipe the audit_logs table, then log the action.
     */
    public function wipeAuditLogs(Request $request): JsonResponse
    {
        $confirm = $request->input('confirm');
        if ($confirm !== 'WIPE') {
            return response()->json(['message' => 'This action requires explicit confirmation. Please pass confirm=WIPE.'], 422);
        }

        $totalRecords = AuditLog::count();

        // Perform truncation
        AuditLog::truncate();

        // Log the deletion itself in the fresh table
        AuditLogService::log(
            'audit_wipe',
            'AuditLog',
            null,
            ['records_deleted' => $totalRecords],
            ['action' => 'TRUNCATE ALL', 'requested_by_ip' => $request->ip(), 'confirm_token_provided' => true]
        );

        return response()->json([
            'message' => 'All audit logs have been permanently deleted, and a record of this action has been created.',
            'records_deleted' => $totalRecords,
        ]);
    }

    /**
     * POST /api/v1/admin/danger/prune-traffic
     * Prune old traffic intelligence records.
     */
    public function pruneTraffic(Request $request): JsonResponse
    {
        $confirm = $request->input('confirm');
        if ($confirm !== 'WIPE') {
            return response()->json(['message' => 'This action requires explicit confirmation. Please pass confirm=WIPE.'], 422);
        }

        $days = (int) $request->input('days', 30);
        if ($days < 7) {
            return response()->json(['message' => 'Retention period must be at least 7 days.'], 422);
        }

        $cutoffDate = now()->subDays($days)->toDateString();
        $cutoffDateTime = now()->subDays($days)->toDateTimeString();

        $deletedHourly = TrafficHourlyStat::where('date', '<', $cutoffDate)->delete();
        $deletedDaily = TrafficDailyStat::where('date', '<', $cutoffDate)->delete();
        $deletedQuality = TrafficQualityScore::where('date', '<', $cutoffDate)->delete();
        $deletedAnomalies = TrafficAnomaly::where('detected_at', '<', $cutoffDateTime)->delete();

        AuditLogService::log(
            'danger_prune_traffic',
            'TrafficHourlyStat',
            null,
            [
                'retention_days' => $days,
                'deleted_hourly' => $deletedHourly,
                'deleted_daily' => $deletedDaily,
                'deleted_quality' => $deletedQuality,
                'deleted_anomalies' => $deletedAnomalies,
            ],
            ['action' => 'PRUNE TRAFFIC DATA', 'cutoff' => $cutoffDate, 'requested_by_ip' => $request->ip()]
        );

        return response()->json([
            'message' => "Traffic data pruning completed successfully. Retained data from the last {$days} days.",
            'deleted_hourly' => $deletedHourly,
            'deleted_daily' => $deletedDaily,
            'deleted_quality' => $deletedQuality,
            'deleted_anomalies' => $deletedAnomalies,
        ]);
    }

    /**
     * POST /api/v1/admin/danger/flush-cache
     * Flush all application/Redis cache.
     */
    public function flushCache(Request $request): JsonResponse
    {
        $confirm = $request->input('confirm');
        if ($confirm !== 'WIPE') {
            return response()->json(['message' => 'This action requires explicit confirmation. Please pass confirm=WIPE.'], 422);
        }

        Cache::flush();

        AuditLogService::log(
            'danger_flush_cache',
            'Cache',
            null,
            null,
            ['action' => 'CACHE FLUSH', 'requested_by_ip' => $request->ip()]
        );

        return response()->json([
            'message' => 'System and application cache has been flushed completely.',
        ]);
    }

    /**
     * POST /api/v1/admin/danger/force-logout
     * Invalidate all active personal access tokens EXCEPT the current user's session.
     */
    public function forceLogoutSessions(Request $request): JsonResponse
    {
        $confirm = $request->input('confirm');
        if ($confirm !== 'WIPE') {
            return response()->json(['message' => 'This action requires explicit confirmation. Please pass confirm=WIPE.'], 422);
        }

        $currentTokenId = $request->user()->currentAccessToken()->id;

        $deletedTokens = DB::table('personal_access_tokens')
            ->where('id', '!=', $currentTokenId)
            ->delete();

        AuditLogService::log(
            'danger_force_logout',
            'User',
            null,
            ['sessions_terminated' => $deletedTokens],
            ['action' => 'TERMINATE OTHER SESSIONS', 'requested_by_ip' => $request->ip()]
        );

        return response()->json([
            'message' => "Successfully invalidated {$deletedTokens} active user session(s). All other users have been logged out.",
            'sessions_terminated' => $deletedTokens,
        ]);
    }

    /**
     * POST /api/v1/admin/danger/refresh-tokens
     * Bulk force-refresh OAuth credentials for all connected GAM accounts.
     */
    public function refreshTokens(Request $request): JsonResponse
    {
        $confirm = $request->input('confirm');
        if ($confirm !== 'WIPE') {
            return response()->json(['message' => 'This action requires explicit confirmation. Please pass confirm=WIPE.'], 422);
        }

        $accounts = GamAccount::all();
        $refreshed = 0;
        $failed = 0;
        $missing = 0;

        foreach ($accounts as $account) {
            if (!$account->refresh_token) {
                $missing++;
                continue;
            }

            try {
                $client = new \GuzzleHttp\Client();
                $response = $client->post('https://oauth2.googleapis.com/token', [
                    'form_params' => [
                        'client_id'     => Setting::get('google_client_id') ?: config('services.google.client_id'),
                        'client_secret' => Setting::get('google_client_secret') ?: config('services.google.client_secret'),
                        'refresh_token' => $account->refresh_token,
                        'grant_type'    => 'refresh_token',
                    ],
                ]);

                $tokens = json_decode($response->getBody()->getContents(), true);

                $account->update([
                    'access_token'     => $tokens['access_token'],
                    'token_expires_at' => now()->addSeconds($tokens['expires_in'] ?? 3600),
                    'status'           => 'active',
                ]);

                $refreshed++;
            } catch (\Exception $e) {
                $account->update(['status' => 'expired']);
                Log::error('GAM token refresh failed for account ' . $account->id . ': ' . $e->getMessage());
                $failed++;
            }
        }

        AuditLogService::log(
            'danger_refresh_tokens',
            'GamAccount',
            null,
            ['refreshed' => $refreshed, 'failed' => $failed, 'missing' => $missing],
            ['action' => 'REFRESH ALL TOKENS', 'requested_by_ip' => $request->ip()]
        );

        return response()->json([
            'message' => "Bulk token refresh completed. Successfully refreshed: {$refreshed}, failed: {$failed}, missing refresh token: {$missing}.",
            'refreshed_count' => $refreshed,
            'failed_count' => $failed,
            'missing_count' => $missing,
        ]);
    }

    /**
     * POST /api/v1/admin/danger/reset-config
     * Resets all configuration settings back to defaults by truncating the settings table and re-seeding it.
     */
    public function resetConfig(Request $request): JsonResponse
    {
        $confirm = $request->input('confirm');
        if ($confirm !== 'WIPE') {
            return response()->json(['message' => 'This action requires explicit confirmation. Please pass confirm=WIPE.'], 422);
        }

        Setting::truncate();
        Cache::flush();

        // Run the seeder
        $seeder = new \Database\Seeders\SettingsSeeder();
        $seeder->run();

        // Ensure global_sync_enabled is re-added
        $exists = Setting::find('global_sync_enabled');
        if (!$exists) {
            Setting::create([
                'key'   => 'global_sync_enabled',
                'value' => 'true',
                'group' => 'gam',
                'label' => 'Global Sync Enabled',
                'type'  => 'boolean',
            ]);
        }

        AuditLogService::log(
            'danger_reset_config',
            'Setting',
            null,
            null,
            ['action' => 'RESET ALL CONFIGS', 'requested_by_ip' => $request->ip()]
        );

        return response()->json([
            'message' => 'All system configurations have been successfully reset to defaults.',
        ]);
    }
}
