<?php

namespace App\Http\Controllers\Publisher;

use App\Http\Controllers\Controller;
use App\Models\Website;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublisherWebsiteController extends Controller
{
    /**
     * GET /api/v1/publisher/websites
     */
    public function index(Request $request): JsonResponse
    {
        $publisherId = $request->user()->publisher_id;

        $websites = Website::where('publisher_id', $publisherId)
            ->with(['gamAccount'])
            ->withCount('adUnits')
            ->orderBy('domain')
            ->get();

        // We can just return the collection mapped
        return response()->json([
            'data' => $websites->map(function ($website) {
                return [
                    'id'               => $website->id,
                    'domain'           => $website->domain,
                    'gam_network_code' => $website->gam_network_code,
                    'is_active'        => $website->is_active,
                    'ad_units_count'   => $website->ad_units_count,
                    'ads_txt'          => $website->gamAccount ? $website->gamAccount->ads_txt : null,
                ];
            })
        ]);
    }

    /**
     * GET /api/v1/publisher/websites/{id}/ad-units
     */
    public function adUnits(Request $request, string $id): JsonResponse
    {
        $publisherId = $request->user()->publisher_id;

        $website = Website::where('id', $id)
            ->where('publisher_id', $publisherId)
            ->firstOrFail();

        $adUnits = $website->adUnits()->orderBy('display_name')->get();

        return response()->json([
            'data' => $adUnits->map(function ($adUnit) {
                return [
                    'id'               => $adUnit->id,
                    'display_name'     => $adUnit->display_name,
                    'gam_ad_unit_name' => $adUnit->gam_ad_unit_name,
                    'is_active'        => $adUnit->is_active,
                    'ad_type'          => $adUnit->ad_type,
                    'ad_subtype'       => $adUnit->ad_subtype,
                    'repeat_count'     => $adUnit->repeat_count,
                    'delay_between_ads'=> $adUnit->delay_between_ads,
                ];
            })
        ]);
    }
}
