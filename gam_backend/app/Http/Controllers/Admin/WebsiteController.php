<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreWebsiteRequest;
use App\Http\Requests\Admin\UpdateWebsiteRequest;
use App\Http\Resources\Admin\WebsiteResource;
use App\Models\RatioHistory;
use App\Models\Website;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\AuditLogService;
use Illuminate\Support\Str;

class WebsiteController extends Controller
{
    /**
     * GET /api/v1/admin/websites
     */
    public function index(Request $request)
    {
        $query = Website::with(['publisher', 'gamAccount'])->withCount('adUnits');

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where('domain', 'like', "%{$search}%");
        }

        if ($request->has('publisher_id')) {
            $query->where('publisher_id', $request->query('publisher_id'));
        }

        if ($request->has('gam_account_id')) {
            $query->where('gam_account_id', $request->query('gam_account_id'));
        }

        $websites = $query->orderBy('domain')->paginate(100);

        return WebsiteResource::collection($websites);
    }

    /**
     * POST /api/v1/admin/websites
     */
    public function store(StoreWebsiteRequest $request): JsonResponse
    {
        $data = $request->validated();

        DB::beginTransaction();

        try {
            $website = Website::create([
                'id'               => Str::uuid()->toString(),
                'publisher_id'     => $data['publisher_id'],
                'gam_account_id'   => $data['gam_account_id'] ?? null,
                'domain'           => $data['domain'],
                'ratio_override'   => $data['ratio_override'] ?? null,
                'gam_network_code' => $data['gam_network_code'] ?? null,
                'is_active'        => $data['is_active'] ?? true,
            ]);

            if (isset($data['ratio_override'])) {
                RatioHistory::create([
                    'id'          => Str::uuid()->toString(),
                    'entity_type' => 'website',
                    'entity_id'   => $website->id,
                    'old_ratio'   => null,
                    'new_ratio'   => $data['ratio_override'],
                    'changed_by'  => $request->user()->id,
                    'changed_at'  => now(),
                ]);
            }

            DB::commit();

            AuditLogService::log('created', 'Website', $website->id, null, $website->toArray());

            return response()->json([
                'message' => 'Website created successfully.',
                'website' => new WebsiteResource($website->load('publisher')),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create website.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/admin/websites/{id}
     */
    public function show(string $id)
    {
        $website = Website::with('publisher')->withCount('adUnits')->findOrFail($id);
        return new WebsiteResource($website);
    }

    /**
     * PUT /api/v1/admin/websites/{id}
     */
    public function update(UpdateWebsiteRequest $request, string $id): JsonResponse
    {
        $website = Website::findOrFail($id);
        $data = $request->validated();

        $oldRatio = $website->ratio_override;
        $oldData = $website->toArray();

        DB::beginTransaction();

        try {
            $website->update([
                'publisher_id'     => $data['publisher_id'] ?? $website->publisher_id,
                'gam_account_id'   => array_key_exists('gam_account_id', $data) ? $data['gam_account_id'] : $website->gam_account_id,
                'domain'           => $data['domain'] ?? $website->domain,
                'ratio_override'   => array_key_exists('ratio_override', $data) ? $data['ratio_override'] : $website->ratio_override,
                'gam_network_code' => array_key_exists('gam_network_code', $data) ? $data['gam_network_code'] : $website->gam_network_code,
                'is_active'        => $data['is_active'] ?? $website->is_active,
            ]);

            if (array_key_exists('ratio_override', $data) && $oldRatio != $data['ratio_override']) {
                RatioHistory::create([
                    'id'          => Str::uuid()->toString(),
                    'entity_type' => 'website',
                    'entity_id'   => $website->id,
                    'old_ratio'   => $oldRatio,
                    'new_ratio'   => $data['ratio_override'],
                    'changed_by'  => $request->user()->id,
                    'changed_at'  => now(),
                ]);
            }

            DB::commit();

            AuditLogService::log('updated', 'Website', $website->id, $oldData, $website->toArray());

            return response()->json([
                'message' => 'Website updated successfully.',
                'website' => new WebsiteResource($website->load('publisher')),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update website.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/v1/admin/websites/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $website = Website::findOrFail($id);

        // FIX [NEW-05]: Guard against deleting websites that have revenue history.
        // Deleting a website cascades to ad_units, which may cascade to revenue_records
        // (FK constraint). Block deletion to protect financial audit trail.
        $revenueCount = \App\Models\RevenueRecord::whereHas('adUnit', function ($q) use ($id) {
            $q->where('website_id', $id);
        })->count();

        if ($revenueCount > 0) {
            return response()->json([
                'message' => "Cannot delete website: {$revenueCount} revenue record(s) are linked to its ad units. Deactivate the website instead to stop syncing.",
            ], 422);
        }

        $oldData = $website->toArray();

        // FIX [NEW-06]: Wrap in transaction so audit log is atomic with the delete.
        DB::beginTransaction();
        try {
            $website->delete();
            AuditLogService::log('deleted', 'Website', $id, $oldData, null);
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to delete website.', 'error' => $e->getMessage()], 500);
        }

        return response()->json(['message' => 'Website deleted successfully.']);
    }
}
