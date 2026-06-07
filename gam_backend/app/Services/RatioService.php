<?php

namespace App\Services;

use App\Models\AdUnit;

class RatioService
{
    /**
     * Resolve the effective ratio for an AdUnit based on the hierarchy:
     * AdUnit Override -> Website Override -> Publisher Default.
     *
     * @param AdUnit $adUnit
     * @return float
     */
    public function resolveRatio(AdUnit $adUnit): float
    {
        // 1. Check AdUnit level
        if ($adUnit->ratio_override !== null) {
            return (float) $adUnit->ratio_override;
        }

        // 2. Check Website level
        if ($adUnit->website && $adUnit->website->ratio_override !== null) {
            return (float) $adUnit->website->ratio_override;
        }

        // 3. Fallback to Publisher level
        if ($adUnit->website && $adUnit->website->publisher) {
            return (float) $adUnit->website->publisher->default_ratio;
        }

        // Fallback if relations are somehow missing (should not happen in valid DB)
        return 0.0;
    }
}
