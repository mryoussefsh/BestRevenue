<x-mail::message>
# Your Payout has been Approved!

Great news! We have approved your payout for the period of **{{ $period }}**.

**Amount:** {{ $amount }}

Your payment will be processed shortly according to your configured payment method.
You can view the full details and history in your dashboard.

<x-mail::button :url="config('app.frontend_url') . '/publisher/payouts'">
View Payout Details
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
