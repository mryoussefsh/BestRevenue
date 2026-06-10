<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    protected $fillable = ['key', 'label', 'subject', 'body'];

    /**
     * Get a template by key. Falls back to hardcoded default if not found in DB.
     */
    public static function getTemplate(string $key): array
    {
        $template = static::where('key', $key)->first();

        if ($template) {
            return [
                'subject' => $template->subject,
                'body'    => $template->body,
            ];
        }

        // Fallback to hardcoded defaults
        return static::defaults($key);
    }

    /**
     * Render a template by replacing {{ variable }} placeholders.
     */
    public static function render(string $template, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $template = str_replace('{{ ' . $key . ' }}', $value ?? '', $template);
            $template = str_replace('{{' . $key . '}}', $value ?? '', $template);
        }
        return $template;
    }

    /**
     * Hardcoded default templates (used if DB row is missing).
     */
    public static function defaults(string $key): array
    {
        $site = config('app.name', 'BestRevenue');
        $loginUrl = config('app.frontend_url', 'http://localhost:5173') . '/login';
        $dashboardUrl = config('app.frontend_url', 'http://localhost:5173') . '/publisher';

        $defaults = [
            'welcome' => [
                'subject' => 'Welcome to {{ site_name }} — Your Account is Approved!',
                'body'    => "<p>Hi {{ name }},</p>
<p>Great news! Your publisher account on <strong>{{ site_name }}</strong> has been <strong>approved</strong>.</p>
<p>You can now log in to your dashboard and start tracking your revenue.</p>
<p><a href='{{ login_url }}' style='background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0;'>Log In to Dashboard</a></p>
<p>Welcome aboard!<br>The {{ site_name }} Team</p>",
            ],
            'registration_pending' => [
                'subject' => '{{ site_name }} — Registration Received, Pending Review',
                'body'    => "<p>Hi {{ name }},</p>
<p>Thank you for registering on <strong>{{ site_name }}</strong>.</p>
<p>Your account is currently <strong>pending admin review</strong>. We will notify you by email once your account is approved.</p>
<p>If you have any questions, feel free to contact our support team.</p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'registration_active' => [
                'subject' => 'Welcome to {{ site_name }} — Account Created!',
                'body'    => "<p>Hi {{ name }},</p>
<p>Welcome to <strong>{{ site_name }}</strong>! Your publisher account has been created and is ready to use.</p>
<p><a href='{{ login_url }}' style='background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0;'>Go to Dashboard</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'account_suspended' => [
                'subject' => 'Important: Your {{ site_name }} Account Has Been Suspended',
                'body'    => "<p>Hi {{ name }},</p>
<p>We regret to inform you that your publisher account on <strong>{{ site_name }}</strong> has been <strong>suspended</strong>.</p>
<p>If you believe this is a mistake or would like more information, please contact our support team.</p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'password_reset' => [
                'subject' => '{{ site_name }} — Password Reset Request',
                'body'    => "<p>Hi {{ name }},</p>
<p>We received a request to reset your password for your <strong>{{ site_name }}</strong> account.</p>
<p>Click the button below to set a new password. This link will expire in <strong>60 minutes</strong>.</p>
<p><a href='{{ reset_link }}' style='background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0;'>Reset My Password</a></p>
<p>If you did not request a password reset, you can safely ignore this email.</p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'payout_created' => [
                'subject' => '{{ site_name }} — A Payout Has Been Queued for You',
                'body'    => "<p>Hi {{ name }},</p>
<p>A payout has been created for your account on <strong>{{ site_name }}</strong>.</p>
<table style='border-collapse:collapse;width:100%;margin:16px 0;'>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Period</td><td style='padding:8px;border:1px solid #ddd;'>{{ period }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Amount</td><td style='padding:8px;border:1px solid #ddd;'>{{ amount }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Payment Method</td><td style='padding:8px;border:1px solid #ddd;'>{{ payment_method }}</td></tr>
</table>
<p>Your payout is currently <strong>pending review</strong>. You will receive another email once it is approved.</p>
<p><a href='{{ dashboard_url }}' style='background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0;'>View Payouts</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'payout_approved' => [
                'subject' => '{{ site_name }} — Your Payout Has Been Approved!',
                'body'    => "<p>Hi {{ name }},</p>
<p>Your payout for <strong>{{ site_name }}</strong> has been <strong>approved</strong>!</p>
<table style='border-collapse:collapse;width:100%;margin:16px 0;'>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Period</td><td style='padding:8px;border:1px solid #ddd;'>{{ period }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Amount</td><td style='padding:8px;border:1px solid #ddd;'>{{ amount }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Payment Method</td><td style='padding:8px;border:1px solid #ddd;'>{{ payment_method }}</td></tr>
</table>
<p>Your payment will be processed shortly.</p>
<p><a href='{{ dashboard_url }}' style='background:#10b981;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0;'>View Payout Details</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'payout_rejected' => [
                'subject' => '{{ site_name }} — Action Required: Payout Rejected',
                'body'    => "<p>Hi {{ name }},</p>
<p>Unfortunately, your payout for <strong>{{ site_name }}</strong> (period <strong>{{ period }}</strong>) has been <strong>rejected</strong>.</p>
<p><strong>Reason:</strong> {{ admin_note }}</p>
<p>Please log in to your dashboard for more details or contact support if you have questions.</p>
<p><a href='{{ dashboard_url }}' style='background:#ef4444;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0;'>View Payouts</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'payout_paid' => [
                'subject' => '{{ site_name }} — Payment Sent!',
                'body'    => "<p>Hi {{ name }},</p>
<p>Great news! Your payment for <strong>{{ site_name }}</strong> has been sent.</p>
<table style='border-collapse:collapse;width:100%;margin:16px 0;'>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Period</td><td style='padding:8px;border:1px solid #ddd;'>{{ period }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Amount Paid</td><td style='padding:8px;border:1px solid #ddd;'>{{ amount }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Payment Reference</td><td style='padding:8px;border:1px solid #ddd;'>{{ payment_reference }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Payment Method</td><td style='padding:8px;border:1px solid #ddd;'>{{ payment_method }}</td></tr>
</table>
<p><a href='{{ dashboard_url }}' style='background:#10b981;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0;'>View Payout History</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'period_closed' => [
                'subject' => '{{ site_name }} — Your Earnings for {{ period }} Have Been Finalized',
                'body'    => "<p>Hi {{ name }},</p>
<p>Your earnings for the period <strong>{{ period }}</strong> on <strong>{{ site_name }}</strong> have been finalized.</p>
<table style='border-collapse:collapse;width:100%;margin:16px 0;'>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Period</td><td style='padding:8px;border:1px solid #ddd;'>{{ period }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Your Earnings</td><td style='padding:8px;border:1px solid #ddd;'>{{ amount }}</td></tr>
</table>
<p>You can review your full revenue breakdown in your dashboard.</p>
<p><a href='{{ dashboard_url }}' style='background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0;'>View Revenue Details</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'manual_payment' => [
                'subject' => '{{ site_name }} — Standalone Manual Payment Recorded',
                'body'    => "<p>Hi {{ name }},</p>
<p>An administrator has recorded a manual payment to your account on <strong>{{ site_name }}</strong>.</p>
<table style='border-collapse:collapse;width:100%;margin:16px 0;'>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Amount</td><td style='padding:8px;border:1px solid #ddd;'>{{ amount }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Payment Method</td><td style='padding:8px;border:1px solid #ddd;'>{{ payment_method }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Reference</td><td style='padding:8px;border:1px solid #ddd;'>{{ reference }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Notes</td><td style='padding:8px;border:1px solid #ddd;'>{{ note }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Date</td><td style='padding:8px;border:1px solid #ddd;'>{{ paid_at }}</td></tr>
</table>
<p>This payment has been deducted from your upcoming period balance as a standalone adjustment.</p>
<p><a href='{{ dashboard_url }}' style='background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0;'>View Payout History</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'ticket_created_admin' => [
                'subject' => '[Ticket #{{ ticket_id }}] New Ticket: {{ subject }}',
                'body'    => "<p>Hello,</p>
<p>A new support ticket has been created on <strong>{{ site_name }}</strong> by <strong>{{ publisher_name }}</strong> ({{ publisher_email }}).</p>
<table style='border-collapse:collapse;width:100%;margin:16px 0;'>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Ticket ID</td><td style='padding:8px;border:1px solid #ddd;'>#{{ ticket_id }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Subject</td><td style='padding:8px;border:1px solid #ddd;'>{{ subject }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Category</td><td style='padding:8px;border:1px solid #ddd;'>{{ category }}</td></tr>
<tr><td style='padding:8px;border:1px solid #ddd;font-weight:600;'>Priority</td><td style='padding:8px;border:1px solid #ddd;'>{{ priority }}</td></tr>
</table>
<p><strong>Initial Message:</strong></p>
<blockquote style='border-left: 4px solid #6366f1; padding-left: 12px; margin-left: 0; color: #475569;'>{{ message }}</blockquote>
<p><a href='{{ admin_ticket_url }}' style='background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0;'>View Ticket in Admin Panel</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'ticket_replied_publisher' => [
                'subject' => '[Ticket #{{ ticket_id }}] New Reply: {{ subject }}',
                'body'    => "<p>Hi {{ name }},</p>
<p>A new reply has been posted to your support ticket <strong>\"{{ subject }}\"</strong> on <strong>{{ site_name }}</strong>.</p>
<p><strong>Latest Message:</strong></p>
<blockquote style='border-left: 4px solid #10b981; padding-left: 12px; margin-left: 0; color: #475569;'>{{ message }}</blockquote>
<p><a href='{{ publisher_ticket_url }}' style='background:#10b981;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0;'>View Ticket & Reply</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'ticket_replied_admin' => [
                'subject' => '[Ticket #{{ ticket_id }}] Publisher Reply: {{ subject }}',
                'body'    => "<p>Hello,</p>
<p>A new reply has been posted by publisher <strong>{{ publisher_name }}</strong> to ticket <strong>\"{{ subject }}\"</strong> on <strong>{{ site_name }}</strong>.</p>
<p><strong>Latest Message:</strong></p>
<blockquote style='border-left: 4px solid #6366f1; padding-left: 12px; margin-left: 0; color: #475569;'>{{ message }}</blockquote>
<p><a href='{{ admin_ticket_url }}' style='background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin:12px 0;'>View Ticket in Admin Panel</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
        ];

        return $defaults[$key] ?? [
            'subject' => 'Notification from {{ site_name }}',
            'body'    => '<p>You have a new notification from {{ site_name }}.</p>',
        ];
    }

    /**
     * Get all template keys with labels (for listing).
     */
    public static function allKeys(): array
    {
        return [
            'welcome'               => 'Account Approved / Welcome',
            'registration_pending'  => 'Registration Received (Pending Review)',
            'registration_active'   => 'Registration Successful (Auto-Approved)',
            'account_suspended'     => 'Account Suspended',
            'password_reset'        => 'Password Reset Request',
            'payout_created'        => 'Payout Created / Queued',
            'payout_approved'       => 'Payout Approved',
            'payout_rejected'       => 'Payout Rejected',
            'payout_paid'           => 'Payment Sent',
            'period_closed'         => 'Period Earnings Finalized',
            'manual_payment'        => 'Manual Payment Recorded',
            'ticket_created_admin'  => 'New Ticket Notification (Admin)',
            'ticket_replied_publisher' => 'New Reply Notification (Publisher)',
            'ticket_replied_admin'  => 'New Reply Notification (Admin)',
        ];
    }
}
