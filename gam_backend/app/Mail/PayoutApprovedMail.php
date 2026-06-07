<?php

namespace App\Mail;

use App\Models\Payout;

class PayoutApprovedMail extends BaseTemplateMail
{
    protected string $templateKey = 'payout_approved';

    public function __construct(Payout $payout)
    {
        $period = $payout->period_year . '-' . str_pad($payout->period_month, 2, '0', STR_PAD_LEFT);

        $this->variables = [
            'name'           => $payout->publisher?->name ?? 'Publisher',
            'email'          => $payout->publisher?->email ?? '',
            'site_name'      => config('app.name'),
            'period'         => $period,
            'amount'         => '$' . number_format($payout->final_amount, 2),
            'payment_method' => $payout->payment_method ?? 'N/A',
            'login_url'      => config('app.frontend_url', 'http://localhost:5173') . '/login',
            'dashboard_url'  => config('app.frontend_url', 'http://localhost:5173') . '/publisher/payouts',
        ];
    }
}
