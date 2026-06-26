<?php

use App\Http\Middleware\RoleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\App\Http\Middleware\SetLocaleMiddleware::class);
        $middleware->trustProxies(at: '*');

        // Register 'role' as a route middleware alias
        $middleware->alias([
            'role' => RoleMiddleware::class,
        ]);

        // Allow all origins in local dev (lock down in production via CORS_ALLOWED_ORIGINS)
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Http\Exceptions\ThrottleRequestsException $e, $request) {
            $retryAfter = $e->getHeaders()['Retry-After'] ?? 60;
            return response()->json([
                'message' => __('auth.throttle', ['seconds' => $retryAfter]),
            ], 429);
        });
    })->create();
