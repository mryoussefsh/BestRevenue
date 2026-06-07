<?php

namespace App\Mail;

use App\Models\Payout;

/**
 * REFACTOR [MPAY-1]: Notification sent to a publisher when an administrator
 * records a manual payment on their behalf.
 *
 * This email is sent by ManualPaymentService and is completely independent of
 * any Period Closing workflow — it is purely an "admin paid you" notification.
 */
class ManualPaymentMail extends BaseTemplateMail
{
    protected string $templateKey = 'manual_payment';

    public function __construct(Payout $payout)
    {
        $this->variables = [
            'name'           => $payout->publisher?->name ?? 'Publisher',
            'email'          => $payout->publisher?->email ?? '',
            'site_name'      => config('app.name'),
            'amount'         => '$' . number_format($payout->final_amount, 2),
            'payment_method' => $payout->payment_method ?? 'N/A',
            'reference'      => $payout->payment_reference ?? 'N/A',
            'note'           => $payout->admin_note ?? '',
            'paid_at'        => $payout->paid_at?->format('Y-m-d H:i') ?? now()->format('Y-m-d H:i'),
            'login_url'      => config('app.frontend_url', 'http://localhost:5173') . '/login',
            'dashboard_url'  => config('app.frontend_url', 'http://localhost:5173') . '/publisher/payouts',
        ];
    }
}
