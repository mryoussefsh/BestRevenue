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

        // Map payouts to expose payment_account and rejection_reason (admin_note only when rejected)
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
                    'payment_account'   => $payout->payment_account,
                    'payment_reference' => $payout->status === 'paid' ? $payout->payment_reference : null,
                    'rejection_reason'  => $payout->status === 'rejected' ? $payout->admin_note : null,
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
        \Log::info("updatePaymentInfo called. Input: " . json_encode($request->all()) . ", User: " . ($request->user() ? $request->user()->email : 'none'));
        try {
            $publisher = $request->user()->publisher;
            if (!$publisher) {
                \Log::warning("updatePaymentInfo: Publisher profile not found for user: " . ($request->user() ? $request->user()->email : 'none'));
                return response()->json(['message' => 'Publisher profile not found.'], 404);
            }

            $request->validate([
                'method'  => 'required|string',
                'account' => 'required|string|max:1000',
            ]);

            // Validate that the method is allowed
            $allowedMethods = \App\Models\Setting::get('payment_methods', []);
            $methodNames = [];
            if (is_array($allowedMethods)) {
                foreach ($allowedMethods as $m) {
                    if (is_array($m)) {
                        if (isset($m['name'])) {
                            $methodNames[] = strtolower($m['name']);
                        }
                    } elseif (is_string($m)) {
                        $methodNames[] = strtolower($m);
                    }
                }
            }

            if (!in_array(strtolower($request->method), $methodNames)) {
                \Log::warning("updatePaymentInfo: Method not allowed. Selected: {$request->method}, Allowed: " . implode(', ', $methodNames));
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

            \Log::info("updatePaymentInfo: Saved successfully for publisher {$publisher->id}");

            return response()->json([
                'message'      => 'Payment information updated successfully.',
                'payment_info' => $publisher->payment_info,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning("updatePaymentInfo validation failed: " . json_encode($e->errors()));
            throw $e;
        } catch (\Exception $e) {
            \Log::error("updatePaymentInfo error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }
}
