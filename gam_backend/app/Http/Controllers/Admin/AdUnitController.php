<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdUnitRequest;
use App\Http\Requests\Admin\UpdateAdUnitRequest;
use App\Http\Resources\Admin\AdUnitResource;
use App\Models\AdUnit;
use App\Models\RatioHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\AuditLogService;
use App\Services\GamApiService;
use App\Models\Website;
use Illuminate\Support\Str;

class AdUnitController extends Controller
{
    /**
     * GET /api/v1/admin/websites/ad-units
     */
    public function index(Request $request)
    {
        $query = AdUnit::with('website');

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where('gam_ad_unit_name', 'like', "%{$search}%")
                  ->orWhere('display_name', 'like', "%{$search}%");
        }

        if ($request->has('website_id')) {
            $query->where('website_id', $request->query('website_id'));
        }

        if ($request->has('publisher_id')) {
            $query->whereHas('website', function ($q) use ($request) {
                $q->where('publisher_id', $request->query('publisher_id'));
            });
        }

        $adUnits = $query->orderBy('gam_ad_unit_name')->paginate(100);

        return AdUnitResource::collection($adUnits);
    }

    /**
     * POST /api/v1/admin/websites/ad-units/create-in-gam
     */
    public function createInGam(Request $request, GamApiService $gamApi): JsonResponse
    {
        $data = $request->validate([
            'website_id'       => 'required|exists:websites,id',
            'gam_ad_unit_name' => 'required|string|max:255',
            'display_name'     => 'required|string|max:255',
            'sizes'            => 'required|array|min:1',
            'sizes.*'          => 'string',
            'ratio_override'   => 'nullable|numeric|min:0.01|max:1', // FIX-26-b: 0% share not allowed
            'ad_type'          => 'required|string|in:banner,reward,interstitial,anchor',
            'ad_subtype'       => 'nullable|string|in:normal,repeated',
        ]);

        DB::beginTransaction();

        try {
            $website = Website::with('gamAccount')->findOrFail($data['website_id']);
            if (!$website->gamAccount) {
                return response()->json(['message' => 'Website is not linked to any GAM account.'], 400);
            }

            // 1. Create in GAM
            $gamAdUnitId = $gamApi->createAdUnit($website->gamAccount, $data['gam_ad_unit_name'], $data['sizes']);

            // 2. Save in Database
            $adUnit = AdUnit::create([
                'id'               => Str::uuid()->toString(),
                'website_id'       => $data['website_id'],
                'gam_ad_unit_name' => $data['gam_ad_unit_name'],
                'gam_ad_unit_id'   => $gamAdUnitId,
                'display_name'     => $data['display_name'],
                'ratio_override'   => $data['ratio_override'] ?? null,
                'is_active'        => true,
                'ad_type'          => $data['ad_type'],
                'ad_subtype'       => $data['ad_subtype'] ?? null,
            ]);

            if (isset($data['ratio_override'])) {
                RatioHistory::create([
                    'id'          => Str::uuid()->toString(),
                    'entity_type' => 'ad_unit',
                    'entity_id'   => $adUnit->id,
                    'old_ratio'   => null,
                    'new_ratio'   => $data['ratio_override'],
                    'changed_by'  => $request->user()->id,
                    'changed_at'  => now(),
                ]);
            }

            DB::commit();

            AuditLogService::log('created_in_gam', 'AdUnit', $adUnit->id, null, $adUnit->toArray());

            return response()->json([
                'message' => 'Ad Unit successfully created in Google Ad Manager and BestRevenue.',
                'ad_unit' => new AdUnitResource($adUnit->load('website')),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('GAM Creation Failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Failed to create ad unit in GAM. ' . $e->getMessage(),
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/websites/ad-units/bulk-create
     * Auto-generates ad units with round-based naming: [domain_slug]_r[N]_[index]
     */
    public function bulkCreate(Request $request, GamApiService $gamApi): JsonResponse
    {
        $data = $request->validate([
            'website_id'     => 'required|exists:websites,id',
            'count'          => 'required|integer|min:1|max:20',
            'sizes'          => 'required|array|min:1',
            'sizes.*'        => 'string',
            'ratio_override' => 'nullable|numeric|min:0.01|max:1', // FIX-26-b: 0% share not allowed
            'ad_type'        => 'required|string|in:banner,reward,interstitial,anchor',
            'ad_subtype'     => 'nullable|string|in:normal,repeated',
        ]);

        $website = Website::with('gamAccount')->findOrFail($data['website_id']);
        if (!$website->gamAccount) {
            return response()->json(['message' => 'Website is not linked to any GAM account.'], 400);
        }

        // Build domain slug: dots and dashes → underscores, lowercase
        $slug = strtolower(preg_replace('/[\.\-]+/', '_', $website->domain));

        // Find the highest existing round number for this domain slug across ALL ad units
        $existingNames = AdUnit::where('gam_ad_unit_name', 'like', "{$slug}_r%")
            ->pluck('gam_ad_unit_name')
            ->toArray();

        $maxRound = 0;
        foreach ($existingNames as $name) {
            // Match pattern: slug_rN_index
            if (preg_match('/^' . preg_quote($slug, '/') . '_r(\d+)_/', $name, $m)) {
                $maxRound = max($maxRound, (int)$m[1]);
            }
        }

        $nextRound = $maxRound + 1;

        // Generate new names for this round
        $newNames = [];
        for ($i = 1; $i <= $data['count']; $i++) {
            $newNames[] = sprintf('%s_r%d_%02d', $slug, $nextRound, $i);
        }

        // Platform-wide uniqueness check before touching GAM
        $conflicts = AdUnit::whereIn('gam_ad_unit_name', $newNames)->pluck('gam_ad_unit_name')->toArray();
        if (!empty($conflicts)) {
            return response()->json([
                'message' => 'Name conflict detected: ' . implode(', ', $conflicts),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $created = [];

            foreach ($newNames as $adUnitName) {
                $gamAdUnitId = $gamApi->createAdUnit($website->gamAccount, $adUnitName, $data['sizes']);

                $adUnit = AdUnit::create([
                    'id'               => Str::uuid()->toString(),
                    'website_id'       => $data['website_id'],
                    'gam_ad_unit_name' => $adUnitName,
                    'gam_ad_unit_id'   => $gamAdUnitId,
                    'display_name'     => $adUnitName,
                    'ratio_override'   => $data['ratio_override'] ?? null,
                    'is_active'        => true,
                    'ad_type'          => $data['ad_type'],
                    'ad_subtype'       => $data['ad_subtype'] ?? null,
                ]);

                if (isset($data['ratio_override'])) {
                    RatioHistory::create([
                        'id'          => Str::uuid()->toString(),
                        'entity_type' => 'ad_unit',
                        'entity_id'   => $adUnit->id,
                        'old_ratio'   => null,
                        'new_ratio'   => $data['ratio_override'],
                        'changed_by'  => $request->user()->id,
                        'changed_at'  => now(),
                    ]);
                }

                AuditLogService::log('bulk_created_in_gam', 'AdUnit', $adUnit->id, null, $adUnit->toArray());
                $created[] = new AdUnitResource($adUnit->load('website'));
            }

            DB::commit();

            return response()->json([
                'message'  => count($created) . ' ad units successfully created in GAM (Round ' . $nextRound . ').',
                'round'    => $nextRound,
                'ad_units' => $created,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('GAM Bulk Creation Failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Failed during bulk creation. ' . $e->getMessage(),
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/websites/ad-units
     */
    public function store(StoreAdUnitRequest $request): JsonResponse
    {
        $data = $request->validated();

        DB::beginTransaction();

        try {
            $adUnit = AdUnit::create([
                'id'               => Str::uuid()->toString(),
                'website_id'       => $data['website_id'],
                'gam_ad_unit_name' => $data['gam_ad_unit_name'],
                // gam_ad_unit_id is auto-discovered on first sync via InventoryService
                'gam_ad_unit_id'   => null,
                'display_name'     => $data['display_name'],
                'ratio_override'   => $data['ratio_override'] ?? null,
                'is_active'        => $data['is_active'] ?? true,
            ]);

            if (isset($data['ratio_override'])) {
                RatioHistory::create([
                    'id'          => Str::uuid()->toString(),
                    'entity_type' => 'ad_unit',
                    'entity_id'   => $adUnit->id,
                    'old_ratio'   => null,
                    'new_ratio'   => $data['ratio_override'],
                    'changed_by'  => $request->user()->id,
                    'changed_at'  => now(),
                ]);
            }

            DB::commit();

            AuditLogService::log('created', 'AdUnit', $adUnit->id, null, $adUnit->toArray());

            return response()->json([
                'message' => 'Ad Unit created successfully.',
                'ad_unit' => new AdUnitResource($adUnit->load('website')),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create ad unit.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/admin/websites/ad-units/{id}
     */
    public function show(string $id)
    {
        $adUnit = AdUnit::with('website')->findOrFail($id);
        return new AdUnitResource($adUnit);
    }

    /**
     * PUT /api/v1/admin/websites/ad-units/{id}
     */
    public function update(UpdateAdUnitRequest $request, string $id): JsonResponse
    {
        $adUnit = AdUnit::findOrFail($id);
        $data = $request->validated();

        $oldRatio = $adUnit->ratio_override;
        $oldData = $adUnit->toArray();

        DB::beginTransaction();

        try {
            $nameChanged = isset($data['gam_ad_unit_name']) && $data['gam_ad_unit_name'] !== $adUnit->gam_ad_unit_name;
            $adUnit->update([
                'website_id'       => $data['website_id'] ?? $adUnit->website_id,
                'gam_ad_unit_name' => $data['gam_ad_unit_name'] ?? $adUnit->gam_ad_unit_name,
                // Clear cached GAM ID when name changes so it gets re-discovered on next sync
                'gam_ad_unit_id'   => $nameChanged ? null : $adUnit->gam_ad_unit_id,
                'display_name'     => $data['display_name'] ?? $adUnit->display_name,
                'ratio_override'   => array_key_exists('ratio_override', $data) ? $data['ratio_override'] : $adUnit->ratio_override,
                'is_active'        => $data['is_active'] ?? $adUnit->is_active,
            ]);

            if (array_key_exists('ratio_override', $data) && $oldRatio != $data['ratio_override']) {
                RatioHistory::create([
                    'id'          => Str::uuid()->toString(),
                    'entity_type' => 'ad_unit',
                    'entity_id'   => $adUnit->id,
                    'old_ratio'   => $oldRatio,
                    'new_ratio'   => $data['ratio_override'],
                    'changed_by'  => $request->user()->id,
                    'changed_at'  => now(),
                ]);
            }

            DB::commit();

            AuditLogService::log('updated', 'AdUnit', $adUnit->id, $oldData, $adUnit->toArray());

            return response()->json([
                'message' => 'Ad Unit updated successfully.',
                'ad_unit' => new AdUnitResource($adUnit->load('website')),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update ad unit.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/v1/admin/websites/ad-units/{id}
     */
    public function destroy(string $id, GamApiService $gamApi): JsonResponse
    {
        $adUnit = AdUnit::with('website.gamAccount')->findOrFail($id);
        $oldData = $adUnit->toArray();
 
        // If the ad unit has a GAM ID and is associated with a GAM account, archive it in GAM
        if ($adUnit->gam_ad_unit_id && $adUnit->website && $adUnit->website->gamAccount) {
            try {
                $gamApi->archiveAdUnits($adUnit->website->gamAccount, [$adUnit->gam_ad_unit_id]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to archive ad unit {$adUnit->gam_ad_unit_id} in GAM: " . $e->getMessage());
                return response()->json([
                    'message' => 'Failed to archive ad unit in Google Ad Manager: ' . $e->getMessage(),
                ], 500);
            }
        }
 
        $adUnit->delete();

        // FIX [NEW-11]: Wrap audit log in try/catch — delete is already committed above via
        // the GAM archive step. The audit log write must not cause an unrelated rollback.
        try {
            AuditLogService::log('deleted', 'AdUnit', $id, $oldData, null);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Audit log failed after AdUnit delete: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Ad Unit deleted successfully.']);
    }

    /**
     * POST /api/v1/admin/ad-units/bulk-delete
     */
    public function bulkDelete(Request $request, GamApiService $gamApi): JsonResponse
    {
        $data = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'string|exists:ad_units,id',
        ]);
 
        $adUnits = AdUnit::with('website.gamAccount')->whereIn('id', $data['ids'])->get();
 
        // Group ad units by GAM Account to archive them in bulk per account
        $byAccount = [];
        foreach ($adUnits as $adUnit) {
            if ($adUnit->gam_ad_unit_id && $adUnit->website && $adUnit->website->gamAccount) {
                $accountId = $adUnit->website->gamAccount->id;
                if (!isset($byAccount[$accountId])) {
                    $byAccount[$accountId] = [
                        'account' => $adUnit->website->gamAccount,
                        'ids' => [],
                    ];
                }
                $byAccount[$accountId]['ids'][] = $adUnit->gam_ad_unit_id;
            }
        }
 
        // Perform archiving in GAM first
        foreach ($byAccount as $accData) {
            try {
                $gamApi->archiveAdUnits($accData['account'], $accData['ids']);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to bulk archive ad units in GAM: " . $e->getMessage());
                return response()->json([
                    'message' => 'Failed to archive ad units in Google Ad Manager: ' . $e->getMessage(),
                ], 500);
            }
        }
 
        DB::beginTransaction();
 
        try {
            $count = 0;
            foreach ($adUnits as $adUnit) {
                $oldData = $adUnit->toArray();
                $adUnit->delete();
                AuditLogService::log('deleted', 'AdUnit', $adUnit->id, $oldData, null);
                $count++;
            }
 
            DB::commit();
 
            return response()->json([
                'message' => "{$count} ad units deleted successfully.",
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete ad units.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
