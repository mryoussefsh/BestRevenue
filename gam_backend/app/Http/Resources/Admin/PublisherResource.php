<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublisherResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $publisherId = $this->id;
        $websiteId = $request->query('website_id');
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');

        $adUnitQuery = \App\Models\AdUnit::query();
        if ($websiteId) {
            $adUnitQuery->where('website_id', $websiteId);
        } else {
            $adUnitQuery->whereIn('website_id', function ($q) use ($publisherId) {
                $q->select('id')->from('websites')->where('publisher_id', $publisherId);
            });
        }
        $adUnitIds = $adUnitQuery->pluck('id')->toArray();

        $limitDate = \App\Models\RevenueRecord::getApprovedLimitDate()->startOfDay()->format('Y-m-d');

        $approvedQuery = \App\Models\RevenueRecord::whereIn('revenue_records.ad_unit_id', $adUnitIds)
            ->whereNull('revenue_records.period_closing_id')
            ->where('revenue_records.date', '<=', $limitDate);

        if ($dateFrom) {
            $approvedQuery->where('revenue_records.date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $approvedQuery->where('revenue_records.date', '<=', $dateTo);
        }

        $rawApprovedRevenue = (float) $approvedQuery->sum('revenue_records.publisher_earnings');
        $approvedBalance = $rawApprovedRevenue;

        $pendingQuery = \App\Models\RevenueRecord::whereIn('revenue_records.ad_unit_id', $adUnitIds)
            ->whereNull('revenue_records.period_closing_id')
            ->where('revenue_records.date', '>', $limitDate);

        if ($dateFrom) {
            $pendingQuery->where('revenue_records.date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $pendingQuery->where('revenue_records.date', '<=', $dateTo);
        }

        $rawPendingRevenue = (float) $pendingQuery->sum('revenue_records.publisher_earnings');
        $pendingBalance = $rawPendingRevenue;

        // Apply manual balance adjustments dynamically
        $posQuery = $this->adjustments()->where('status', 'pending')->where('amount', '>', 0);
        $negQuery = $this->adjustments()->where('status', 'pending')->where('amount', '<', 0);
        $adjTotalQuery = $this->adjustments()->where('status', 'pending');

        if ($dateFrom) {
            $posQuery->where('created_at', '>=', $dateFrom . ' 00:00:00');
            $negQuery->where('created_at', '>=', $dateFrom . ' 00:00:00');
            $adjTotalQuery->where('created_at', '>=', $dateFrom . ' 00:00:00');
        }
        if ($dateTo) {
            $posQuery->where('created_at', '<=', $dateTo . ' 23:59:59');
            $negQuery->where('created_at', '<=', $dateTo . ' 23:59:59');
            $adjTotalQuery->where('created_at', '<=', $dateTo . ' 23:59:59');
        }

        $posAdjustments = (float) $posQuery->sum('amount');
        $negAdjustments = (float) $negQuery->sum('amount');
        $pendingAdjustment = (float) $adjTotalQuery->sum('amount');

        $approvedBalance += $posAdjustments;

        if ($negAdjustments < 0) {
            $deduction = abs($negAdjustments);
            if ($deduction <= $approvedBalance) {
                $approvedBalance -= $deduction;
            } else {
                $remainder = $deduction - $approvedBalance;
                $approvedBalance = 0.0;
                $pendingBalance -= $remainder;
            }
        }

        $payoutQuery = \App\Models\Payout::where('publisher_id', $publisherId)
            ->where('status', 'paid');

        if ($dateFrom) {
            $payoutQuery->where('created_at', '>=', $dateFrom . ' 00:00:00');
        }
        if ($dateTo) {
            $payoutQuery->where('created_at', '<=', $dateTo . ' 23:59:59');
        }

        $totalPayout = $payoutQuery->sum('final_amount');

        // Unfiltered approved balance (ignores date and website filters to show true wallet balance ready for payout)
        $unfilteredAdUnitIds = \App\Models\AdUnit::whereIn('website_id', function ($q) use ($publisherId) {
            $q->select('id')->from('websites')->where('publisher_id', $publisherId);
        })->pluck('id')->toArray();

        $unfilteredApprovedQuery = \App\Models\RevenueRecord::whereIn('revenue_records.ad_unit_id', $unfilteredAdUnitIds)
            ->whereNull('revenue_records.period_closing_id')
            ->where('revenue_records.date', '<=', $limitDate);

        $unfilteredRawApprovedRevenue = (float) $unfilteredApprovedQuery->sum('revenue_records.publisher_earnings');
        $unfilteredPosAdjustments = (float) $this->adjustments()->where('status', 'pending')->where('amount', '>', 0)->sum('amount');
        $unfilteredNegAdjustments = (float) $this->adjustments()->where('status', 'pending')->where('amount', '<', 0)->sum('amount');

        $unfilteredApprovedBalance = $unfilteredRawApprovedRevenue + $unfilteredPosAdjustments;
        if ($unfilteredNegAdjustments < 0) {
            $unfilteredDeduction = abs($unfilteredNegAdjustments);
            if ($unfilteredDeduction <= $unfilteredApprovedBalance) {
                $unfilteredApprovedBalance -= $unfilteredDeduction;
            } else {
                $unfilteredApprovedBalance = 0.0;
            }
        }

        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'email'         => $this->email,
            'phone'         => $this->phone,
            'telegram'      => $this->telegram,
            'skype'         => $this->skype,
            'country'       => $this->country,
            'reg_ip'        => $this->reg_ip,
            'last_ip'       => $this->last_ip,
            'approved_balance' => (float) $approvedBalance,
            'ready_for_payout_balance' => (float) $unfilteredApprovedBalance,
            'pending_balance'  => (float) $pendingBalance,
            'raw_approved_revenue' => $rawApprovedRevenue,
            'raw_pending_revenue'  => $rawPendingRevenue,
            'total_payout'     => (float) $totalPayout,
            'pending_balance_adjustment' => (float) $pendingAdjustment,
            'default_ratio' => (float) $this->default_ratio,
            'status'        => $this->status,
            'payment_info'  => $this->payment_info,
            'notes'         => $this->notes,
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,
            // Include user details if loaded
            'user'          => $this->whenLoaded('user', function () {
                return [
                    'id'        => $this->user->id,
                    'is_active' => $this->user->is_active,
                ];
            }),
            // Count of websites
            'websites_count'=> $this->whenCounted('websites'),
        ];
    }
}
