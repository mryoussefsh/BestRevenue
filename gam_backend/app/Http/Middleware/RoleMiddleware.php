<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Usage in routes:
     *   Route::middleware(['auth:sanctum', 'role:admin'])->group(...)
     *   Route::middleware(['auth:sanctum', 'role:publisher'])->group(...)
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user->role !== $role) {
            return response()->json([
                'message' => 'Forbidden. You do not have permission to access this resource.',
            ], 403);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Account suspended.'], 403);
        }

        return $next($request);
    }
}
