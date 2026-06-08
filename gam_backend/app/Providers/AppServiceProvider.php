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
        // Dynamically load and configure the platform-wide timezone from settings
        if (config('app.key') && \Illuminate\Support\Facades\Schema::hasTable('settings')) {
            try {
                $timezone = \App\Models\Setting::get('platform_timezone', 'UTC');
                date_default_timezone_set($timezone);
                config(['app.timezone' => $timezone]);
                
                // Configure Database Connection timezone configs
                config(['database.connections.mysql.timezone' => $timezone]);
                config(['database.connections.pgsql.timezone' => $timezone]);

                // Sync timezone on the already active database connection
                $connection = \Illuminate\Support\Facades\DB::connection();
                if ($connection && $connection->getPdo()) {
                    $driver = $connection->getDriverName();
                    if ($driver === 'mysql') {
                        $connection->unprepared("SET time_zone = '{$timezone}'");
                    } elseif ($driver === 'pgsql') {
                        $connection->unprepared("SET timezone TO '{$timezone}'");
                    }
                }
            } catch (\Exception $e) {}
        }

        // Tell Sanctum to use the UUID-compatible PersonalAccessToken
        // This is required because our users.id is a UUID (string), not bigint
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        // Dynamically apply database mail/SMTP settings when the MailManager resolves
        $this->app->resolving('mail.manager', function () {
            \App\Services\MailConfigService::applyFromSettings();
        });
    }
}
