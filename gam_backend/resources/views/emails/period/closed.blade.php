<x-mail::message>
# Earnings Finalized for {{ $periodStr }}

Hello,

Your earnings for the period **{{ $periodStr }}** have been finalized.
You can now download your official PDF statement and review the final breakdown in your dashboard.

<x-mail::button :url="config('app.frontend_url') . '/publisher/revenue'">
View Revenue Details
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
