<?php

namespace App\Services;

use App\Models\AdUnit;
use App\Models\GamAccount;
use App\Models\Setting;
use Google\AdsApi\AdManager\AdManagerSessionBuilder;
use Google\AdsApi\AdManager\v202605\ReportService;
use Google\AdsApi\AdManager\v202605\ReportJob;
use Google\AdsApi\AdManager\v202605\ReportQuery;
use Google\AdsApi\AdManager\v202605\Column;
use Google\AdsApi\AdManager\v202605\Dimension;
use Google\AdsApi\AdManager\v202605\DateRangeType;
use Google\AdsApi\AdManager\v202605\InventoryService;
use Google\AdsApi\AdManager\v202605\NetworkService;
use Google\AdsApi\AdManager\v202605\AdUnit as GamAdUnit;
use Google\AdsApi\AdManager\v202605\AdUnitTargetWindow;
use Google\AdsApi\AdManager\v202605\AdUnitSize;
use Google\AdsApi\AdManager\v202605\Size;
use Google\AdsApi\AdManager\v202605\EnvironmentType;
use Google\AdsApi\AdManager\v202605\ArchiveAdUnits;
use Google\AdsApi\AdManager\AdManagerServices;
use Google\AdsApi\AdManager\Util\v202605\ReportDownloader;
use Google\AdsApi\AdManager\Util\v202605\StatementBuilder;
use Google\AdsApi\Common\OAuth2TokenBuilder;
use Exception;
use RuntimeException;

class GamApiService
{
    /**
     * Build an authenticated AdManager session for the given account.
     */
    private function buildSession(GamAccount $account): array
    {
        if (!$account->refresh_token) {
            throw new RuntimeException("GAM Account {$account->email} is missing an OAuth refresh token.");
        }
        if (!$account->network_code) {
            throw new RuntimeException("GAM Account {$account->email} is missing a Network Code.");
        }

        $oAuth2Credential = (new OAuth2TokenBuilder())
            ->withClientId(Setting::get('google_client_id'))
            ->withClientSecret(Setting::get('google_client_secret'))
            ->withRefreshToken($account->refresh_token)
            ->build();

        $session = (new AdManagerSessionBuilder())
            ->withNetworkCode($account->network_code)
            ->withApplicationName('BestRevenue Sync System')
            ->withOAuth2Credential($oAuth2Credential)
            ->build();

        $adManagerServices = new AdManagerServices();

        return [$session, $adManagerServices];
    }

    /**
     * Resolve GAM numeric Ad Unit IDs for the ad units registered for this account.
     * If a stored ad unit already has a gam_ad_unit_id, use it directly.
     * Otherwise look it up from GAM's InventoryService and persist it.
     *
     * Returns an array of numeric ad unit ID strings (empty = none registered).
     */
    public function resolveAdUnitIds(GamAccount $account): array
    {
        // Get all ad units registered for this GAM account
        $adUnits = AdUnit::whereHas('website', fn($q) => $q->where('gam_account_id', $account->id))
            ->where('is_active', true)
            ->get();

        if ($adUnits->isEmpty()) {
            return [];
        }

        // Separate already-known IDs from ones we still need to look up
        $knownIds   = [];
        $needLookup = [];

        foreach ($adUnits as $unit) {
            if ($unit->gam_ad_unit_id) {
                $knownIds[] = $unit->gam_ad_unit_id;
            } else {
                $needLookup[] = $unit;
            }
        }

        if (!empty($needLookup)) {
            // Look up IDs from GAM InventoryService
            try {
                [$session, $adManagerServices] = $this->buildSession($account);
                $inventoryService = $adManagerServices->get($session, \Google\AdsApi\AdManager\v202605\InventoryService::class);

                foreach ($needLookup as $unit) {
                    $name = $unit->gam_ad_unit_name;

                    $statementBuilder = (new StatementBuilder())
                        ->where('name = :name')
                        ->withBindVariableValue('name', new \Google\AdsApi\AdManager\v202605\TextValue($name))
                        ->limit(1);

                    $page = $inventoryService->getAdUnitsByStatement($statementBuilder->toStatement());

                    if ($page->getTotalResultSetSize() > 0) {
                        $gamId = (string) $page->getResults()[0]->getId();
                        $unit->update(['gam_ad_unit_id' => $gamId]);
                        $knownIds[] = $gamId;
                    }
                    // If not found, we skip — it will just fetch all and filter by name as fallback
                }
            } catch (\Exception $e) {
                // InventoryService lookup failed — fall back to name-based filtering
                \Illuminate\Support\Facades\Log::warning("GAM InventoryService lookup failed for {$account->email}: " . $e->getMessage());
            }
        }

        return $knownIds;
    }

    /**
     * Fetch a report from Google Ad Manager using the provided GamAccount credentials.
     * Filters the report to only the ad units registered in BestRevenue for this account.
     *
     * @param GamAccount $account
     * @param int $daysBack
     * @return array  Empty array if no ad units are registered for this account.
     * @throws Exception
     */
    public function fetchReport(GamAccount $account, int $daysBack): array
    {
        [$session, $adManagerServices] = $this->buildSession($account);

        /** @var ReportService $reportService */
        $reportService = $adManagerServices->get($session, ReportService::class);

        // Try to build a WHERE clause filtering by GAM Ad Unit IDs
        $adUnitIds = $this->resolveAdUnitIds($account);

        $statementBuilder = new StatementBuilder();

        if (!empty($adUnitIds)) {
            // Use GAM's ID-based filter — only fetch rows for our registered ad units
            $idList = implode(', ', $adUnitIds);
            $statementBuilder->where("AD_UNIT_ID IN ($idList)");
        }
        // If $adUnitIds is empty, the statement is blank and fetches all (name-filter fallback applies in parsing)

        // Build report query
        $reportQuery = new ReportQuery();
        $reportQuery->setDimensions([
            Dimension::DATE,
            Dimension::AD_UNIT_NAME,
        ]);
        $reportQuery->setColumns([
            Column::TOTAL_LINE_ITEM_LEVEL_IMPRESSIONS,
            Column::TOTAL_LINE_ITEM_LEVEL_CLICKS,
            Column::TOTAL_LINE_ITEM_LEVEL_CPM_AND_CPC_REVENUE,
            Column::TOTAL_INVENTORY_LEVEL_UNFILLED_IMPRESSIONS,
            Column::TOTAL_LINE_ITEM_LEVEL_WITH_CPD_AVERAGE_ECPM,
            Column::TOTAL_ACTIVE_VIEW_ELIGIBLE_IMPRESSIONS,
            Column::TOTAL_ACTIVE_VIEW_VIEWABLE_IMPRESSIONS,
        ]);

        $reportQuery->setStatement($statementBuilder->toStatement());
        $reportQuery->setDateRangeType(DateRangeType::CUSTOM_DATE);

        $startDate = now()->subDays($daysBack);
        $endDate   = now();

        $reportQuery->setStartDate(
            new \Google\AdsApi\AdManager\v202605\Date($startDate->year, $startDate->month, $startDate->day)
        );
        $reportQuery->setEndDate(
            new \Google\AdsApi\AdManager\v202605\Date($endDate->year, $endDate->month, $endDate->day)
        );

        // Run report job
        $reportJob = new ReportJob();
        $reportJob->setReportQuery($reportQuery);
        $reportJob = $reportService->runReportJob($reportJob);

        // Wait and download
        $reportDownloader = new ReportDownloader($reportService, $reportJob->getId());
        $reportDownloader->waitForReportToFinish();

        $filePath = tempnam(sys_get_temp_dir(), 'gam_report_') . '.csv.gz';
        $reportDownloader->downloadReport('CSV_DUMP', $filePath);

        // FIX [GS-6, SEC-10]: Only copy the GAM report to storage/logs/ in debug mode.
        // In production this file accumulated indefinitely (one per account per sync),
        // filling disk with sensitive ad revenue data that was never cleaned up.
        if (config('app.debug')) {
            $safeEmail = preg_replace('/[^a-zA-Z0-9]/', '_', $account->email);
            copy($filePath, storage_path("logs/gam_report_{$safeEmail}.csv.gz"));
        }

        $data = $this->parseReportCsv($filePath);
        @unlink($filePath);

        return $data;
    }

    /**
     * Parses the CSV_DUMP compressed file from Google Ad Manager.
     */
    private function parseReportCsv(string $filePath): array
    {
        $data = [];

        $fp = gzopen($filePath, 'r');
        if (!$fp) {
            throw new RuntimeException("Could not open downloaded report file.");
        }

        $header = fgetcsv($fp);

        if (!$header) {
            gzclose($fp);
            return $data;
        }

        $headerMap = array_flip($header);

        while (($row = fgetcsv($fp)) !== false) {
            if (isset($row[0]) && strpos($row[0], 'Total') !== false) {
                break;
            }

            $date        = $row[$headerMap['Dimension.DATE']] ?? null;
            $adUnitName  = $row[$headerMap['Dimension.AD_UNIT_NAME']] ?? null;

            $impressions      = (int)   ($row[$headerMap['Column.TOTAL_LINE_ITEM_LEVEL_IMPRESSIONS']] ?? 0);
            $clicks           = (int)   ($row[$headerMap['Column.TOTAL_LINE_ITEM_LEVEL_CLICKS']] ?? 0);
            $grossRevenue     = (float) ($row[$headerMap['Column.TOTAL_LINE_ITEM_LEVEL_CPM_AND_CPC_REVENUE']] ?? 0) / 1000000;
            $unfilled         = (int)   ($row[$headerMap['Column.TOTAL_INVENTORY_LEVEL_UNFILLED_IMPRESSIONS']] ?? 0);
            $cpm              = (float) ($row[$headerMap['Column.TOTAL_LINE_ITEM_LEVEL_WITH_CPD_AVERAGE_ECPM']] ?? 0) / 1000000;
            $avEligible       = (int)   ($row[$headerMap['Column.TOTAL_ACTIVE_VIEW_ELIGIBLE_IMPRESSIONS']] ?? 0);
            $avViewable       = (int)   ($row[$headerMap['Column.TOTAL_ACTIVE_VIEW_VIEWABLE_IMPRESSIONS']] ?? 0);

            if ($date && $adUnitName) {
                $data[] = [
                    'date'                              => $date,
                    'ad_unit_name'                      => $adUnitName,
                    'impressions'                       => $impressions,
                    'clicks'                            => $clicks,
                    'gross_revenue'                     => $grossRevenue,
                    'unfilled_impressions'              => $unfilled,
                    'cpm'                               => $cpm,
                    'active_view_eligible_impressions'  => $avEligible,
                    'active_view_viewable_impressions'  => $avViewable,
                ];
            }
        }

        gzclose($fp);

        return $data;
    }

    /**
     * Create a new Ad Unit in Google Ad Manager
     * 
     * @param GamAccount $account
     * @param string $name The GAM Ad Unit Name/Code
     * @param array $sizes e.g. ["300x250", "320x50", "Fluid"]
     * @return string The new GAM Ad Unit ID
     */
    public function createAdUnit(GamAccount $account, string $name, array $sizes): string
    {
        [$session, $adManagerServices] = $this->buildSession($account);

        $inventoryService = $adManagerServices->get($session, InventoryService::class);
        $networkService = $adManagerServices->get($session, NetworkService::class);

        // Get the effective root ad unit ID
        $network = $networkService->getCurrentNetwork();
        $rootAdUnitId = $network->getEffectiveRootAdUnitId();

        $adUnit = new GamAdUnit();
        $adUnit->setName($name);
        $adUnit->setAdUnitCode($name);
        // By default, create it under the root
        $adUnit->setParentId($rootAdUnitId);
        $adUnit->setTargetWindow(AdUnitTargetWindow::BLANK);

        // Process sizes
        $gamSizes       = [];
        $sizeKeys       = []; // for dedup: "WxH_aspectRatio_envType"
        $isFluid        = false;
        $isInterstitial = false;

        foreach ($sizes as $sizeStr) {
            $normalized = strtolower(trim($sizeStr));

            if ($normalized === 'fluid') {
                $isFluid = true;
                continue;
            }

            if (in_array($normalized, ['out-of-page', 'out_of_page', 'outofpage'])) {
                $isInterstitial = true;
                continue;
            }

            // Standard WxH size — also handle unicode × char
            $cleaned = str_replace(['×', ' '], ['x', ''], strtolower($sizeStr));
            $parts   = explode('x', $cleaned);
            if (count($parts) === 2 && is_numeric($parts[0]) && is_numeric($parts[1])) {
                $adUnitSize = new AdUnitSize();
                $size = new Size();
                $size->setWidth((int)$parts[0])->setHeight((int)$parts[1])->setIsAspectRatio(false);
                $adUnitSize->setSize($size)->setEnvironmentType(EnvironmentType::BROWSER);
                $key = "{$parts[0]}x{$parts[1]}_noaspect_BROWSER";

                if (!isset($sizeKeys[$key])) {
                    $sizeKeys[$key] = true;
                    $gamSizes[] = $adUnitSize;
                }
            }
        }

        // Set flags on the AdUnit
        $adUnit->setIsFluid($isFluid);
        $adUnit->setIsInterstitial($isInterstitial);

        // Fall back to 1x1 if absolutely nothing was selected/valid
        if (empty($gamSizes) && !$isFluid && !$isInterstitial) {
            $size = new Size();
            $size->setWidth(1)->setHeight(1)->setIsAspectRatio(false);
            $adUnitSize = new AdUnitSize();
            $adUnitSize->setSize($size)->setEnvironmentType(EnvironmentType::BROWSER);
            $gamSizes[] = $adUnitSize;
        }

        if (!empty($gamSizes)) {
            $adUnit->setAdUnitSizes($gamSizes);
        }

        // Create the ad unit
        $createdAdUnits = $inventoryService->createAdUnits([$adUnit]);

        if (empty($createdAdUnits)) {
            throw new RuntimeException("Failed to create ad unit in Google Ad Manager.");
        }

        return (string) $createdAdUnits[0]->getId();
    }

    /**
     * Archive one or more ad units in Google Ad Manager.
     * 
     * @param GamAccount $account
     * @param array $gamAdUnitIds The numeric GAM Ad Unit IDs to archive
     */
    public function archiveAdUnits(GamAccount $account, array $gamAdUnitIds): void
    {
        if (empty($gamAdUnitIds)) {
            return;
        }

        [$session, $adManagerServices] = $this->buildSession($account);
        $inventoryService = $adManagerServices->get($session, InventoryService::class);

        // Group by 500 (API limits action on max 500 items per call)
        $chunks = array_chunk($gamAdUnitIds, 500);

        foreach ($chunks as $chunk) {
            $statementBuilder = new StatementBuilder();
            $statementBuilder->where('id IN (' . implode(',', array_map('intval', $chunk)) . ')');
            
            $action = new ArchiveAdUnits();
            $inventoryService->performAdUnitAction($action, $statementBuilder->toStatement());
        }
    }
}
