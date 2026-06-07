<?php

namespace App\Mail;

use App\Models\PeriodClosing;
use App\Models\Publisher;

class PeriodClosedMail extends BaseTemplateMail
{
    protected string $templateKey = 'period_closed';

    public function __construct(PeriodClosing $period, Publisher $publisher, float $earnings = 0.0)
    {
        $periodStr = $period->period_year . '-' . str_pad($period->period_month, 2, '0', STR_PAD_LEFT);

        $this->variables = [
            'name'          => $publisher->name,
            'email'         => $publisher->email,
            'site_name'     => config('app.name'),
            'period'        => $periodStr,
            'amount'        => '$' . number_format($earnings, 2),
            'login_url'     => config('app.frontend_url', 'http://localhost:5173') . '/login',
            'dashboard_url' => config('app.frontend_url', 'http://localhost:5173') . '/publisher/revenue',
        ];
    }
}
