<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Tell Sanctum to use the UUID-compatible PersonalAccessToken
        // This is required because our users.id is a UUID (string), not bigint
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        // Dynamically apply database mail/SMTP settings when the MailManager resolves
        $this->app->resolving('mail.manager', function () {
            \App\Services\MailConfigService::applyFromSettings();
        });
    }
}
