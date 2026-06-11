<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Illuminate\Http\JsonResponse;

class PublicPageController extends Controller
{
    /**
     * Display the specified active page by slug.
     */
    public function show(string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        return response()->json($page);
    }
}
