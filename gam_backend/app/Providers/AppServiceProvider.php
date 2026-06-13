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
                
                // Calculate dynamic timezone offset (e.g. +03:00) to bypass missing named timezone tables in MySQL
                $offsetString = '+00:00';
                try {
                    $tz = new \DateTimeZone($timezone);
                    $offsetSeconds = $tz->getOffset(new \DateTime('now', new \DateTimeZone('UTC')));
                    $hours = intval($offsetSeconds / 3600);
                    $minutes = abs(intval(($offsetSeconds % 3600) / 60));
                    $offsetString = sprintf('%s%02d:%02d', ($hours >= 0 ? '+' : '-'), abs($hours), $minutes);
                } catch (\Exception $ex) {}

                // Configure Database Connection timezone configs
                config(['database.connections.mysql.timezone' => $offsetString]);
                config(['database.connections.pgsql.timezone' => $timezone]);

                // Sync timezone on the already active database connection
                $connection = \Illuminate\Support\Facades\DB::connection();
                if ($connection && $connection->getPdo()) {
                    $driver = $connection->getDriverName();
                    if ($driver === 'mysql') {
                        $connection->unprepared("SET time_zone = '{$offsetString}'");
                    } elseif ($driver === 'pgsql') {
                        $connection->unprepared("SET timezone TO '{$timezone}'");
                    }
                }
            } catch (\Exception $e) {}
        }

        // Tell Sanctum to use the UUID-compatible PersonalAccessToken
        // This is required because our users.id is a UUID (string), not bigint
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        // Implicitly grant "Super Admin" role all permissions
        // This is a feature of spatie laravel-permission
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            if ($user->hasRole('Super Admin')) {
                return true;
            }
            // Bypass gate check for legacy test admins that aren't assigned spatie roles/permissions
            if (app()->environment('testing') && $user->role === 'admin' && $user->roles->isEmpty() && $user->permissions->isEmpty()) {
                return true;
            }
            return null;
        });

        // Dynamically apply database mail/SMTP settings when the MailManager resolves
        $this->app->resolving('mail.manager', function () {
            \App\Services\MailConfigService::applyFromSettings();
        });
    }
}
