<?php

namespace App\Http\Controllers\Publisher;

use App\Http\Controllers\Controller;
use App\Models\Adjustment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublisherAdjustmentController extends Controller
{
    /**
     * GET /api/v1/publisher/adjustments
     */
    public function index(Request $request): JsonResponse
    {
        $publisherId = $request->user()->publisher_id;

        if (!$publisherId) {
            return response()->json([
                'message' => 'Publisher profile not found for this user.'
            ], 404);
        }

        $adjustments = Adjustment::with('periodClosing')
            ->where('publisher_id', $publisherId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $adjustments->map(function ($adj) {
                return [
                    'id'                => $adj->id,
                    'amount'            => (float) $adj->amount,
                    'notes'             => $adj->notes,
                    'status'            => $adj->status,
                    'period_closing'    => $adj->periodClosing ? [
                        'id'           => $adj->periodClosing->id,
                        'period_year'  => $adj->periodClosing->period_year,
                        'period_month' => $adj->periodClosing->period_month,
                    ] : null,
                    'created_at'        => $adj->created_at,
                ];
            })
        ]);
    }
}
