<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (file_exists(public_path('index.html'))) {
        return file_get_contents(public_path('index.html'));
    }
    return view('welcome');
});

Route::get('storage/{path}', function ($path) {
    // Prevent directory traversal attacks
    if (str_contains($path, '..') || str_contains($path, '\\')) {
        abort(404);
    }

    $disk = \Illuminate\Support\Facades\Storage::disk('public');
    $filePath = $disk->path($path);
    $basePath = realpath($disk->path(''));
    $realFilePath = realpath($filePath);

    if ($realFilePath === false || !str_starts_with($realFilePath, $basePath)) {
        abort(404);
    }

    return response()->file($realFilePath);
})->where('path', '.*');

Route::fallback(function () {
    if (file_exists(public_path('index.html'))) {
        return file_get_contents(public_path('index.html'));
    }
    return response()->json(['message' => 'Frontend not built yet. Run npm run build in gam_frontend.'], 404);
});
