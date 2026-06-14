<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocaleMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header('X-Locale') ?? $request->header('Accept-Language') ?? 'en';
        $locale = str_starts_with(strtolower($locale), 'ar') ? 'ar' : 'en';
        app()->setLocale($locale);

        return $next($request);
    }
}
