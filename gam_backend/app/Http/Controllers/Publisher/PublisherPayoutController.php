<?php

namespace App\Http\Controllers\Publisher;

use App\Http\Controllers\Controller;
use App\Models\Payout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublisherPayoutController extends Controller
{
    /**
     * GET /api/v1/publisher/payouts
     */
    public function index(Request $request): JsonResponse
    {
        $publisherId = $request->user()->publisher_id;

        $payouts = Payout::where('publisher_id', $publisherId)
                          ->orderBy('created_at', 'desc')
                          ->get();

        // Map payouts to hide admin_note
        return response()->json([
            'data' => $payouts->map(function ($payout) {
                return [
                    'id'                => $payout->id,
                    'period_year'       => $payout->period_year,
                    'period_month'      => $payout->period_month,
                    'amount'            => (float) $payout->amount,
                    'adjustment'        => (float) $payout->adjustment,
                    'final_amount'      => (float) $payout->final_amount,
                    'status'            => $payout->status,
                    'payment_method'    => $payout->payment_method,
                    'payment_reference' => $payout->status === 'paid' ? $payout->payment_reference : null,
                    'approved_at'       => $payout->approved_at,
                    'paid_at'           => $payout->paid_at,
                    'created_at'        => $payout->created_at,
                ];
            })
        ]);
    }
}
