<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Publisher;
use App\Models\Payout;
use App\Models\RevenueRecord;

$publishers = Publisher::all();
foreach ($publishers as $pub) {
    echo "=========================================\n";
    echo "Publisher: {$pub->name} ({$pub->id})\n";
    echo "Email: {$pub->email}\n";
    echo "Pending Balance Adj: {$pub->pending_balance_adjustment}\n";
    
    // Revenue totals
    $approvedRev = RevenueRecord::whereHas('adUnit.website', function($q) use ($pub) {
        $q->where('publisher_id', $pub->id);
    })->where(function($q) {
        $q->whereNotNull('period_closing_id')
          ->orWhere('date', '<=', RevenueRecord::getApprovedLimitDate()->format('Y-m-d'));
    })->sum('publisher_earnings');
    
    $pendingRev = RevenueRecord::whereHas('adUnit.website', function($q) use ($pub) {
        $q->where('publisher_id', $pub->id);
    })->whereNull('period_closing_id')
      ->where('date', '>', RevenueRecord::getApprovedLimitDate()->format('Y-m-d'))
      ->sum('publisher_earnings');
      
    echo "Total Approved Revenue: {$approvedRev}\n";
    echo "Total Pending Revenue: {$pendingRev}\n";
    
    // Payouts
    $payouts = Payout::where('publisher_id', $pub->id)->get();
    echo "Payouts count: " . $payouts->count() . "\n";
    foreach ($payouts as $p) {
        echo "  - ID: {$p->id}, Period: {$p->period_year}-{$p->period_month}, Amount: {$p->amount}, Adj: {$p->adjustment}, Final: {$p->final_amount}, Status: {$p->status}\n";
    }
}
