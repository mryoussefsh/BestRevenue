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

    /**
     * PUT /api/v1/publisher/payment-info
     */
    public function updatePaymentInfo(Request $request): JsonResponse
    {
        $publisher = $request->user()->publisher;
        if (!$publisher) {
            return response()->json(['message' => 'Publisher profile not found.'], 404);
        }

        $request->validate([
            'method'  => 'required|string',
            'account' => 'required|string|max:1000',
        ]);

        // Validate that the method is allowed
        $allowedMethods = \App\Models\Setting::get('payment_methods', []);
        $methodNames = array_map(function ($m) {
            return strtolower($m['name'] ?? '');
        }, $allowedMethods);

        if (!in_array(strtolower($request->method), $methodNames)) {
            return response()->json([
                'message' => 'Selected payment method is not allowed or supported by the platform.',
                'errors' => [
                    'method' => ['Selected payment method is not supported.']
                ]
            ], 422);
        }

        $publisher->payment_info = [
            'method'  => $request->method,
            'account' => $request->account,
        ];
        $publisher->save();

        return response()->json([
            'message'      => 'Payment information updated successfully.',
            'payment_info' => $publisher->payment_info,
        ]);
    }
}
