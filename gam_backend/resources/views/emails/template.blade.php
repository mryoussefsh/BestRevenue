@include('emails.layout', [
    'body'             => $body,
    'site_name'        => $site_name        ?? config('app.name'),
    'site_logo'        => $site_logo        ?? null,
    'company_address'  => $company_address  ?? null,
    'social_facebook'  => $social_facebook  ?? null,
    'social_instagram' => $social_instagram ?? null,
    'social_x'         => $social_x         ?? null,
    'social_telegram'  => $social_telegram  ?? null,
    'support_email'    => $support_email    ?? null,
    'frontend_url'     => $frontend_url     ?? '',
])
