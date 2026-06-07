<x-mail::message>
# Action Required: Payout Rejected

Hello,

Unfortunately, your payout for the period of **{{ $period }}** has been rejected.
This usually happens if your payment method details are incomplete or invalid, or due to a compliance issue.

Please review your payment information and contact your account manager for further assistance.

<x-mail::button :url="config('app.frontend_url') . '/publisher/payouts'">
View Dashboard
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
