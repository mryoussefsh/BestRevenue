@include('emails.layout', [
    'body'      => $body,
    'site_name' => $site_name ?? config('app.name'),
])
