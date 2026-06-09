<?php

namespace App\Console\Commands;

use App\Models\Adjustment;
use App\Models\Payout;
use App\Models\PeriodClosing;
use App\Models\Publisher;
use App\Models\RevenueRecord;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PeriodAutoClose extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'period:auto-close {--force-month= : Override month (1-12)} {--force-year= : Override year}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically closes the previous month and generates payouts if today is the payout day.';

    /**
     * Execute the console command.
     *
     * FIX [PC-1, PC-3]: ALL revenue records are now locked to the period during closing,
     * regardless of whether the publisher meets the payout threshold or has a payment method.
     * This prevents revenue from bleeding across periods and causing double-counts.
     *
     * Two-pass approach:
     *   Pass 1 — Find all publishers with unclosed revenue + adjustments, lock ALL their records.
     *   Pass 2 — For each locked publisher, determine if a payout should be generated
     *             (threshold met AND payment method configured). If not, just roll over balance.
     */
    public function handle()
    {
        $isManualOverride = $this->option('force-month') && $this->option('force-year');

        $autoEnabled = Setting::get('payout_auto_enabled', true);
        if (!$autoEnabled && !$isManualOverride) {
            $this->info("Auto-closing is disabled in settings. Skipping.");
            return 0;
        }

        $closePeriodDay = (int) Setting::get('close_period_day', 20);
        $today = (int) now()->format('j');

        if ($today < $closePeriodDay && !$isManualOverride) {
            $this->info("Today is day $today. Auto-close is scheduled for day $closePeriodDay. Skipping.");
            return 0;
        }

        // We close the *previous* month (or the forced month)
        // FIX: startOfMonth() prevents day-of-month overflows when now() is on a 31st day
        $targetDate = now()->startOfMonth()->subMonth();
        $year  = $this->option('force-year')  ?: $targetDate->year;
        $month = $this->option('force-month') ?: $targetDate->month;

        // Check if target month is approved according to settings
        $approveEarningsDay = (int) Setting::get('approve_earnings_day', 1);
        $todayDay = (int) now()->format('j');

        $isTargetApproved = false;
        $prevMonthDate = now()->startOfMonth()->subMonth();
        $forcedDate    = Carbon::create($year, $month, 1)->startOfMonth();

        if ($forcedDate->lt($prevMonthDate)) {
            $isTargetApproved = true;
        } elseif ($forcedDate->equalTo($prevMonthDate)) {
            if ($todayDay >= $approveEarningsDay) {
                $isTargetApproved = true;
            }
        }

        // FIX [PC-6]: Prevent force-closing a future or current month
        $currentMonthStart = now()->startOfMonth();
        if ($forcedDate->gte($currentMonthStart) && $isManualOverride) {
            $this->error("Cannot close the current or a future month. Target: {$year}-{$month}.");
            return 1;
        }

        if (!$isTargetApproved && !$isManualOverride) {
            $this->info("Earnings for period $year-$month are not approved yet (Approval day is day $approveEarningsDay of the month). Skipping closing.");
            return 0;
        }

        $endOfMonth  = Carbon::create($year, $month, 1)->endOfMonth()->format('Y-m-d');

        // Check if already closed
        $existing = PeriodClosing::where('period_year', $year)
            ->where('period_month', $month)
            ->first();

        $periodId = $existing ? $existing->id : null;

        // ─────────────────────────────────────────────────────────────────────
        // STEP 1: Identify ALL publishers with unclosed revenue OR pending
        //         adjustments up to the end of this period.
        //
        // Exclude pending adjustments that are already marked with the existing period closing ID
        // (e.g. carry-over adjustments created during a manual payout run for this period).
        // ─────────────────────────────────────────────────────────────────────
        $revenuePublishers = RevenueRecord::whereNull('period_closing_id')
            ->where('date', '<=', $endOfMonth)
            ->join('ad_units', 'revenue_records.ad_unit_id', '=', 'ad_units.id')
            ->join('websites', 'ad_units.website_id', '=', 'websites.id')
            ->distinct()
            ->pluck('websites.publisher_id')
            ->toArray();

        $adjustmentPublishers = Adjustment::where('status', 'pending')
            ->where(function ($q) use ($periodId) {
                if ($periodId) {
                    $q->whereNull('period_closing_id')
                      ->orWhere('period_closing_id', '!=', $periodId);
                }
            })
            ->where('created_at', '<=', $endOfMonth . ' 23:59:59')
            ->distinct()
            ->pluck('publisher_id')
            ->toArray();

        $publisherIds = array_unique(array_merge($revenuePublishers, $adjustmentPublishers));

        if ($existing && count($publisherIds) === 0) {
            if ($existing->status === 'closing') {
                $existing->update([
                    'status' => 'closed',
                    'closed_at' => now(),
                    'total_gross_revenue' => 0.00,
                    'total_publisher_earnings' => 0.00,
                    'total_impressions' => 0,
                ]);
                $this->info("Period $year-$month has no unclosed records. Marked as closed.");
            } else {
                $this->info("Period $year-$month is already {$existing->status} and no unclosed records remain. Skipping.");
            }
            return 0;
        }

        $this->info("Starting closing process for $year-$month...");

        try {
            $threshold   = (float) Setting::get('payout_threshold', 50.00);

            DB::beginTransaction();

            try {
            // ─────────────────────────────────────────────────────────────────────
            // STEP 2: Retrieve or Create PeriodClosing record and lock it
            // ─────────────────────────────────────────────────────────────────────
            if ($existing) {
                $period = PeriodClosing::lockForUpdate()->find($existing->id);
                $period->update([
                    'status' => 'closing',
                ]);
            } else {
                $period = PeriodClosing::create([
                    'id'          => Str::uuid()->toString(),
                    'period_year' => $year,
                    'period_month'=> $month,
                    'status'      => 'closing',
                    'notes'       => 'Auto-generated by period:auto-close',
                ]);
            }

            // FIX [PC-3]: Use string-based bcadd() for financial accumulation to prevent
            // floating-point rounding errors when summing across many publishers.
            $totalGross       = '0';
            $totalEarnings    = '0';
            $totalImpressions = 0;
            $payoutsCreated   = 0;
            $rollovers        = 0;
            $publisherEarningsMap = [];

            foreach ($publisherIds as $pubId) {
                $publisher = Publisher::find($pubId);
                if (!$publisher) continue;

                // ─────────────────────────────────────────────────────────────────
                // STEP 3: Calculate this publisher's earnings for this period
                // ─────────────────────────────────────────────────────────────────
                $revenueStats = RevenueRecord::whereNull('period_closing_id')
                    ->where('date', '<=', $endOfMonth)
                    ->join('ad_units', 'revenue_records.ad_unit_id', '=', 'ad_units.id')
                    ->join('websites', 'ad_units.website_id', '=', 'websites.id')
                    ->where('websites.publisher_id', $pubId)
                    ->select(
                        DB::raw('SUM(revenue_records.gross_revenue) as total_gross'),
                        DB::raw('SUM(revenue_records.publisher_earnings) as total_earnings'),
                        DB::raw('SUM(revenue_records.impressions) as total_impressions')
                    )
                    ->first();

                $pubGross       = (float) ($revenueStats->total_gross ?? 0);
                $pubEarnings    = (float) ($revenueStats->total_earnings ?? 0);
                $pubImpressions = (int)   ($revenueStats->total_impressions ?? 0);

                // FIX [NEW-08]: Use lockForUpdate() on adjustment reads inside the transaction.
                // Without row-level locks, two concurrent period closes could both read the same
                // pending adjustment and both mark it as applied — causing double-application.
                $pendingAdjustments = Adjustment::where('publisher_id', $pubId)
                    ->where('status', 'pending')
                    ->where(function ($q) use ($period) {
                        $q->whereNull('period_closing_id')
                          ->orWhere('period_closing_id', '!=', $period->id);
                    })
                    ->lockForUpdate()
                    ->get();

                $adjustmentSum = '0';
                foreach ($pendingAdjustments as $adj) {
                    $adjustmentSum = bcadd($adjustmentSum, (string) $adj->amount, 6);
                }
                $adjustmentSum = (float) $adjustmentSum;

                $finalAmount = $pubEarnings + $adjustmentSum;
                $publisherEarningsMap[$pubId] = $finalAmount;

                // ─────────────────────────────────────────────────────────────────
                // STEP 4: ALWAYS lock revenue records to this period closing.
                //
                // FIX [PC-1, PC-3]: Previously, publishers below threshold or without
                // payment method were skipped with 'continue', leaving their records
                // unlocked. This caused revenue to accumulate across periods, leading
                // to double-counting. Now we ALWAYS lock, then decide about payouts.
                // ─────────────────────────────────────────────────────────────────
                RevenueRecord::whereNull('period_closing_id')
                    ->where('date', '<=', $endOfMonth)
                    ->whereHas('adUnit.website', function ($q) use ($pubId) {
                        $q->where('publisher_id', $pubId);
                    })
                    ->update(['period_closing_id' => $period->id]);

                // FIX [PC-3]: Use bcadd() with 6 decimal precision to avoid floating-point drift.
                $totalGross       = bcadd($totalGross, (string) $pubGross, 6);
                $totalEarnings    = bcadd($totalEarnings, (string) $pubEarnings, 6);
                $totalImpressions += $pubImpressions; // integers are exact

                // ─────────────────────────────────────────────────────────────────
                // STEP 5: Check payout eligibility
                // ─────────────────────────────────────────────────────────────────
                $hasPaymentMethod = $publisher->payment_info
                    && is_array($publisher->payment_info)
                    && !empty($publisher->payment_info['method']);
                $hasPaymentAccount = $publisher->payment_info
                    && is_array($publisher->payment_info)
                    && !empty($publisher->payment_info['account']);

                $customThreshold = null;
                if ($hasPaymentMethod) {
                    $selectedMethodName = $publisher->payment_info['method'];
                    $paymentMethodsSetting = Setting::get('payment_methods', []);
                    if (is_array($paymentMethodsSetting)) {
                        foreach ($paymentMethodsSetting as $m) {
                            $mName = null;
                            $mMin = null;
                            if (is_array($m)) {
                                $mName = $m['name'] ?? null;
                                $mMin = $m['minimum'] ?? null;
                            } elseif (is_string($m)) {
                                $mName = $m;
                            }

                            if ($mName !== null && strtolower($mName) === strtolower($selectedMethodName)) {
                                if ($mMin !== null) {
                                    $customThreshold = (float) $mMin;
                                }
                                break;
                            }
                        }
                    }
                }

                $activeThreshold = $customThreshold !== null ? $customThreshold : $threshold;
                $belowThreshold = $finalAmount < $activeThreshold;

                $payoutEligible = !$belowThreshold && $hasPaymentMethod && $hasPaymentAccount;

                if (!$payoutEligible) {
                    // Publisher is ineligible for a payout this period, but records ARE locked.
                    // Their balance carries forward through the still-pending adjustment system.
                    if ($belowThreshold) {
                        $this->info("Publisher {$publisher->name}: below threshold (\${$finalAmount} < \${$activeThreshold}). Records locked, balance rolls over.");
                    } else {
                        $this->info("Publisher {$publisher->name}: no payment method configured. Records locked, balance rolls over.");
                    }

                    // Mark old adjustments as applied so they are not double-counted next month
                    if ($pendingAdjustments->isNotEmpty()) {
                        Adjustment::whereIn('id', $pendingAdjustments->pluck('id'))
                            ->update([
                                'status'            => 'applied',
                                'period_closing_id' => $period->id,
                            ]);
                    }

                    // FIX [PC-1, PC-3]: Create a pending 'rollover' adjustment for the total balance
                    // ($finalAmount) so it carries forward to the next period.
                    if ($finalAmount > 0.005) {
                        Adjustment::forceCreate([
                            'id'                => Str::uuid()->toString(),
                            'publisher_id'      => $pubId,
                            'amount'            => $finalAmount,
                            'notes'             => "Rollover balance from period {$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT),
                            'status'            => 'pending',
                            'period_closing_id' => $period->id,
                            'created_by'        => null,
                            'created_at'        => Carbon::create($year, $month, 1)->endOfMonth(),
                        ]);
                    }

                    DB::afterCommit(function () use ($pubId) {
                        Publisher::syncPendingBalance($pubId);
                    });

                    $rollovers++;
                    continue;
                }

                // ─────────────────────────────────────────────────────────────────
                // STEP 6: Create Payout for eligible publishers
                // ─────────────────────────────────────────────────────────────────
                $paymentMethod = $publisher->payment_info['method'] ?? null;

                Payout::create([
                    'id'                => Str::uuid()->toString(),
                    'publisher_id'      => $publisher->id,
                    'period_closing_id' => $period->id,
                    'period_year'       => $year,
                    'period_month'      => $month,
                    'amount'            => $pubEarnings,
                    'adjustment'        => $adjustmentSum,
                    'final_amount'      => $finalAmount,
                    'status'            => 'pending',
                    'admin_note'        => null,
                    'payment_method'    => $paymentMethod,
                ]);

                // Mark adjustments as applied for payout-eligible publishers
                if ($pendingAdjustments->isNotEmpty()) {
                    Adjustment::whereIn('id', $pendingAdjustments->pluck('id'))
                        ->update([
                            'status'            => 'applied',
                            'period_closing_id' => $period->id,
                        ]);
                }

                DB::afterCommit(function () use ($pubId) {
                    Publisher::syncPendingBalance($pubId);
                });

                $payoutsCreated++;

                $this->info("Publisher {$publisher->name}: payout generated for \${$finalAmount}.");
            }

            // ─────────────────────────────────────────────────────────────────────
            // STEP 7: Mark PeriodClosing as 'closed' with aggregate totals
            // ─────────────────────────────────────────────────────────────────────
            $stats = RevenueRecord::where('period_closing_id', $period->id)
                ->select(
                    DB::raw('SUM(gross_revenue) as total_gross'),
                    DB::raw('SUM(publisher_earnings) as total_earnings'),
                    DB::raw('SUM(impressions) as total_impressions')
                )
                ->first();

            $period->update([
                'total_gross_revenue'      => (float) ($stats->total_gross ?? 0),
                'total_publisher_earnings' => (float) ($stats->total_earnings ?? 0),
                'total_impressions'        => (int)   ($stats->total_impressions ?? 0),
                'status'                   => 'closed',
                'closed_at'                => now(),
            ]);

            DB::commit();

            \App\Services\AuditLogService::log('closed', 'PeriodClosing', $period->id, null, $period->toArray());

            // ─────────────────────────────────────────────────────────────────────
            // STEP 8: Send email notifications
            // ─────────────────────────────────────────────────────────────────────
            // Query fresh payouts from database to bypass any Eloquent relation cache issues
            $payouts = Payout::where('period_closing_id', $period->id)->with('publisher')->get();

            // All publishers in period → period_closed email
            foreach ($publisherIds as $pubId) {
                $pub = Publisher::find($pubId);
                if (!$pub || !$pub->email) continue;
                $earnings = $publisherEarningsMap[$pubId] ?? 0.0;
                try {
                    Mail::to($pub->email)->send(new \App\Mail\PeriodClosedMail($period, $pub, $earnings));
                    \App\Services\AuditLogService::log(
                        'email_sent',
                        'Publisher',
                        $pub->id,
                        null,
                        [
                            'email_type' => 'period_closed',
                            'recipient'  => $pub->email,
                            'trigger'    => 'auto_close',
                            'period'     => "{$year}-{$month}",
                        ]
                    );
                } catch (\Exception $e) {}
            }

            // Only payout-eligible publishers → payout_created email
            foreach ($payouts as $payout) {
                if ($payout->publisher && $payout->publisher->email) {
                    try {
                        Mail::to($payout->publisher->email)->send(new \App\Mail\PayoutCreatedMail($payout));
                        \App\Services\AuditLogService::log(
                            'email_sent',
                            'Payout',
                            $payout->id,
                            null,
                            [
                                'email_type' => 'payout_created',
                                'recipient'  => $payout->publisher->email,
                                'trigger'    => 'auto_close',
                                'payout_id'  => $payout->id,
                            ]
                        );
                    } catch (\Exception $e) {}
                }
            }

            $this->info("Successfully closed period $year-$month.");
            $this->table(
                ['Publishers Processed', 'Payouts Created', 'Rollovers', 'Total Gross', 'Total Earnings'],
                [[count($publisherIds), $payoutsCreated, $rollovers, number_format($totalGross, 2), number_format($totalEarnings, 2)]]
            );

            return 0;

            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("Failed to close period: " . $e->getMessage());
                return 1;
            }
        } finally {
            \Illuminate\Support\Facades\Cache::lock("period_close_lock_{$year}_{$month}")->forceRelease();
        }
    }
}
