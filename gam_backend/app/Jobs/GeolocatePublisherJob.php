<?php

namespace App\Jobs;

use App\Http\Controllers\Auth\RegisterController;
use App\Models\Publisher;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * FIX [R-1]: Async IP geolocation job.
 *
 * Instead of calling ipinfo.io synchronously during user registration
 * (which blocks the HTTP request and causes timeouts if the API is slow),
 * this job runs asynchronously after the publisher is created.
 *
 * With QUEUE_CONNECTION=sync (current dev config), this runs immediately
 * but in a separate call stack — it won't block the registration response.
 *
 * With QUEUE_CONNECTION=database or redis, this runs in the background.
 */
class GeolocatePublisherJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30; // Retry after 30 seconds

    public function __construct(
        private readonly string $publisherId,
        private readonly string $ip
    ) {}

    public function handle(): void
    {
        $publisher = Publisher::find($this->publisherId);
        if (!$publisher) {
            // Publisher was deleted before the job ran (rare edge case)
            return;
        }

        // Skip if country already set (e.g., if job ran twice due to retry)
        if ($publisher->country) {
            return;
        }

        $country = RegisterController::detectCountry($this->ip);

        if ($country) {
            $publisher->update(['country' => $country]);
            Log::info("Geolocated publisher {$this->publisherId} as country: {$country}");
        } else {
            Log::warning("GeolocatePublisherJob: Could not detect country for publisher {$this->publisherId} with IP {$this->ip}");
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::warning("GeolocatePublisherJob failed for publisher {$this->publisherId}: " . $exception->getMessage());
        // Non-critical — country is optional, failure is acceptable
    }
}
