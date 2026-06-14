<?php

namespace App\Http\Controllers;

use App\Models\Translation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TranslationController extends Controller
{
    /**
     * GET /api/v1/translations/{locale}
     * Public endpoint — returns full translation map for React i18n.
     */
    public function show(string $locale): JsonResponse
    {
        if (! in_array($locale, ['en', 'ar'])) {
            return response()->json(['message' => 'Locale not supported.'], 422);
        }

        return response()->json(Translation::getLocaleMap($locale));
    }

    /**
     * PUT /api/v1/admin/translations/{locale}/{key}
     * Admin only — update a translation string.
     */
    public function update(Request $request, string $locale, string $key): JsonResponse
    {
        if (! in_array($locale, ['en', 'ar'])) {
            return response()->json(['message' => 'Locale not supported.'], 422);
        }

        $request->validate([
            'value' => 'required|string',
        ]);

        $translation = Translation::where('locale', $locale)
            ->where('key', $key)
            ->firstOrFail();

        $translation->value = $request->value;
        $translation->updated_at = now();
        $translation->save();

        return response()->json([
            'message' => 'Translation updated.',
            'locale'  => $locale,
            'key'     => $key,
            'value'   => $translation->value,
        ]);
    }

    /**
     * GET /api/v1/admin/translations
     * Admin only — all translations paginated for editing in the UI.
     */
    public function index(Request $request): JsonResponse
    {
        $locale = $request->query('locale', 'en');
        $group  = $request->query('group');

        $query = Translation::where('locale', $locale)
            ->orderBy('group')
            ->orderBy('key');

        if ($group) {
            $query->where('group', $group);
        }

        return response()->json($query->paginate(5000));
    }
}
