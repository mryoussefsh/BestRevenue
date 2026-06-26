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
        $site = config('app.name', 'Mindora X');
        $loginUrl = config('app.frontend_url', 'http://localhost:5173') . '/login';
        $dashboardUrl = config('app.frontend_url', 'http://localhost:5173') . '/publisher';

        $defaults = [
            'welcome' => [
                'subject' => 'Welcome to {{ site_name }} — Your Account is Approved!',
                'body'    => "<p>Hi {{ name }},</p>
<p>Great news! Your publisher account on <strong>{{ site_name }}</strong> has been <strong>approved</strong>.</p>
<p>You can now log in to your dashboard and start tracking your revenue.</p>
<p><a href='{{ login_url }}' style='background:transparent;color:#00d4e0;padding:11px 28px;border-radius:50px;border:1.5px solid #00d4e0;text-decoration:none;display:inline-block;margin:16px 0;font-weight:600;font-size:13px;letter-spacing:0.5px;box-shadow:0 0 16px rgba(0,212,224,0.22),inset 0 0 8px rgba(0,212,224,0.04);'>Log In to Dashboard</a></p>
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
<p><a href='{{ login_url }}' style='background:transparent;color:#00d4e0;padding:11px 28px;border-radius:50px;border:1.5px solid #00d4e0;text-decoration:none;display:inline-block;margin:16px 0;font-weight:600;font-size:13px;letter-spacing:0.5px;box-shadow:0 0 16px rgba(0,212,224,0.22),inset 0 0 8px rgba(0,212,224,0.04);'>Go to Dashboard</a></p>
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
<p><a href='{{ reset_link }}' style='background:transparent;color:#00d4e0;padding:11px 28px;border-radius:50px;border:1.5px solid #00d4e0;text-decoration:none;display:inline-block;margin:16px 0;font-weight:600;font-size:13px;letter-spacing:0.5px;box-shadow:0 0 16px rgba(0,212,224,0.22),inset 0 0 8px rgba(0,212,224,0.04);'>Reset My Password</a></p>
<p>If you did not request a password reset, you can safely ignore this email.</p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'payout_created' => [
                'subject' => '{{ site_name }} — A Payout Has Been Queued for You',
                'body'    => "<p>Hi {{ name }},</p>
<p>A payout has been created for your account on <strong>{{ site_name }}</strong>.</p>
<table>
<tr><td>Period</td><td>{{ period }}</td></tr>
<tr><td>Amount</td><td>{{ amount }}</td></tr>
<tr><td>Payment Method</td><td>{{ payment_method }}</td></tr>
</table>
<p>Your payout is currently <strong>pending review</strong>. You will receive another email once it is approved.</p>
<p><a href='{{ dashboard_url }}' style='background:transparent;color:#00d4e0;padding:11px 28px;border-radius:50px;border:1.5px solid #00d4e0;text-decoration:none;display:inline-block;margin:16px 0;font-weight:600;font-size:13px;letter-spacing:0.5px;box-shadow:0 0 16px rgba(0,212,224,0.22),inset 0 0 8px rgba(0,212,224,0.04);'>View Payouts</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'payout_approved' => [
                'subject' => '{{ site_name }} — Your Payout Has Been Approved!',
                'body'    => "<p>Hi {{ name }},</p>
<p>Your payout for <strong>{{ site_name }}</strong> has been <strong>approved</strong>!</p>
<table>
<tr><td>Period</td><td>{{ period }}</td></tr>
<tr><td>Amount</td><td>{{ amount }}</td></tr>
<tr><td>Payment Method</td><td>{{ payment_method }}</td></tr>
</table>
<p>Your payment will be processed shortly.</p>
<p><a href='{{ dashboard_url }}' style='background:transparent;color:#10b981;padding:11px 28px;border-radius:50px;border:1.5px solid #10b981;text-decoration:none;display:inline-block;margin:16px 0;font-weight:600;font-size:13px;letter-spacing:0.5px;box-shadow:0 0 16px rgba(16,185,129,0.20),inset 0 0 8px rgba(16,185,129,0.04);'>View Payout Details</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'payout_rejected' => [
                'subject' => '{{ site_name }} — Action Required: Payout Rejected',
                'body'    => "<p>Hi {{ name }},</p>
<p>Unfortunately, your payout for <strong>{{ site_name }}</strong> (period <strong>{{ period }}</strong>) has been <strong>rejected</strong>.</p>
<p><strong>Reason:</strong> {{ admin_note }}</p>
<p>Please log in to your dashboard for more details or contact support if you have questions.</p>
<p><a href='{{ dashboard_url }}' style='background:transparent;color:#f43f5e;padding:11px 28px;border-radius:50px;border:1.5px solid #f43f5e;text-decoration:none;display:inline-block;margin:16px 0;font-weight:600;font-size:13px;letter-spacing:0.5px;box-shadow:0 0 16px rgba(244,63,94,0.20),inset 0 0 8px rgba(244,63,94,0.04);'>View Payouts</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'payout_paid' => [
                'subject' => '{{ site_name }} — Payment Sent!',
                'body'    => "<p>Hi {{ name }},</p>
<p>Great news! Your payment for <strong>{{ site_name }}</strong> has been sent.</p>
<table>
<tr><td>Period</td><td>{{ period }}</td></tr>
<tr><td>Amount Paid</td><td>{{ amount }}</td></tr>
<tr><td>Payment Reference</td><td>{{ payment_reference }}</td></tr>
<tr><td>Payment Method</td><td>{{ payment_method }}</td></tr>
</table>
<p><a href='{{ dashboard_url }}' style='background:transparent;color:#10b981;padding:11px 28px;border-radius:50px;border:1.5px solid #10b981;text-decoration:none;display:inline-block;margin:16px 0;font-weight:600;font-size:13px;letter-spacing:0.5px;box-shadow:0 0 16px rgba(16,185,129,0.20),inset 0 0 8px rgba(16,185,129,0.04);'>View Payout History</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'period_closed' => [
                'subject' => '{{ site_name }} — Your Earnings for {{ period }} Have Been Finalized',
                'body'    => "<p>Hi {{ name }},</p>
<p>Your earnings for the period <strong>{{ period }}</strong> on <strong>{{ site_name }}</strong> have been finalized.</p>
<table>
<tr><td>Period</td><td>{{ period }}</td></tr>
<tr><td>Your Earnings</td><td>{{ amount }}</td></tr>
</table>
<p>You can review your full revenue breakdown in your dashboard.</p>
<p><a href='{{ dashboard_url }}' style='background:transparent;color:#00d4e0;padding:11px 28px;border-radius:50px;border:1.5px solid #00d4e0;text-decoration:none;display:inline-block;margin:16px 0;font-weight:600;font-size:13px;letter-spacing:0.5px;box-shadow:0 0 16px rgba(0,212,224,0.22),inset 0 0 8px rgba(0,212,224,0.04);'>View Revenue Details</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'manual_payment' => [
                'subject' => '{{ site_name }} — Standalone Manual Payment Recorded',
                'body'    => "<p>Hi {{ name }},</p>
<p>An administrator has recorded a manual payment to your account on <strong>{{ site_name }}</strong>.</p>
<table>
<tr><td>Amount</td><td>{{ amount }}</td></tr>
<tr><td>Payment Method</td><td>{{ payment_method }}</td></tr>
<tr><td>Reference</td><td>{{ reference }}</td></tr>
<tr><td>Notes</td><td>{{ note }}</td></tr>
<tr><td>Date</td><td>{{ paid_at }}</td></tr>
</table>
<p>This payment has been deducted from your upcoming period balance as a standalone adjustment.</p>
<p><a href='{{ dashboard_url }}' style='background:transparent;color:#00d4e0;padding:11px 28px;border-radius:50px;border:1.5px solid #00d4e0;text-decoration:none;display:inline-block;margin:16px 0;font-weight:600;font-size:13px;letter-spacing:0.5px;box-shadow:0 0 16px rgba(0,212,224,0.22),inset 0 0 8px rgba(0,212,224,0.04);'>View Payout History</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'ticket_created_admin' => [
                'subject' => '[Ticket #{{ ticket_id }}] New Ticket: {{ subject }}',
                'body'    => "<p>Hello,</p>
<p>A new support ticket has been created on <strong>{{ site_name }}</strong> by <strong>{{ publisher_name }}</strong> ({{ publisher_email }}).</p>
<table>
<tr><td>Ticket ID</td><td>#{{ ticket_id }}</td></tr>
<tr><td>Subject</td><td>{{ subject }}</td></tr>
<tr><td>Category</td><td>{{ category }}</td></tr>
<tr><td>Priority</td><td>{{ priority }}</td></tr>
</table>
<p><strong>Initial Message:</strong></p>
<blockquote style='border-left:4px solid #8b5cf6;padding-left:14px;margin-left:0;color:#64748b;background:rgba(139,92,246,0.04);border-radius:0 6px 6px 0;padding:12px 14px;'>{{ message }}</blockquote>
<p><a href='{{ admin_ticket_url }}' style='background:transparent;color:#00d4e0;padding:11px 28px;border-radius:50px;border:1.5px solid #00d4e0;text-decoration:none;display:inline-block;margin:16px 0;font-weight:600;font-size:13px;letter-spacing:0.5px;box-shadow:0 0 16px rgba(0,212,224,0.22),inset 0 0 8px rgba(0,212,224,0.04);'>View Ticket in Admin Panel</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'ticket_replied_publisher' => [
                'subject' => '[Ticket #{{ ticket_id }}] New Reply: {{ subject }}',
                'body'    => "<p>Hi {{ name }},</p>
<p>A new reply has been posted to your support ticket <strong>\"{{ subject }}\"</strong> on <strong>{{ site_name }}</strong>.</p>
<p><strong>Latest Message:</strong></p>
<blockquote style='border-left:4px solid #10b981;padding-left:14px;margin-left:0;color:#64748b;background:rgba(16,185,129,0.04);border-radius:0 6px 6px 0;padding:12px 14px;'>{{ message }}</blockquote>
<p><a href='{{ publisher_ticket_url }}' style='background:transparent;color:#10b981;padding:11px 28px;border-radius:50px;border:1.5px solid #10b981;text-decoration:none;display:inline-block;margin:16px 0;font-weight:600;font-size:13px;letter-spacing:0.5px;box-shadow:0 0 16px rgba(16,185,129,0.20),inset 0 0 8px rgba(16,185,129,0.04);'>View Ticket & Reply</a></p>
<p>Best regards,<br>The {{ site_name }} Team</p>",
            ],
            'ticket_replied_admin' => [
                'subject' => '[Ticket #{{ ticket_id }}] Publisher Reply: {{ subject }}',
                'body'    => "<p>Hello,</p>
<p>A new reply has been posted by publisher <strong>{{ publisher_name }}</strong> to ticket <strong>\"{{ subject }}\"</strong> on <strong>{{ site_name }}</strong>.</p>
<p><strong>Latest Message:</strong></p>
<blockquote style='border-left:4px solid #8b5cf6;padding-left:14px;margin-left:0;color:#64748b;background:rgba(139,92,246,0.04);border-radius:0 6px 6px 0;padding:12px 14px;'>{{ message }}</blockquote>
<p><a href='{{ admin_ticket_url }}' style='background:transparent;color:#00d4e0;padding:11px 28px;border-radius:50px;border:1.5px solid #00d4e0;text-decoration:none;display:inline-block;margin:16px 0;font-weight:600;font-size:13px;letter-spacing:0.5px;box-shadow:0 0 16px rgba(0,212,224,0.22),inset 0 0 8px rgba(0,212,224,0.04);'>View Ticket in Admin Panel</a></p>
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








