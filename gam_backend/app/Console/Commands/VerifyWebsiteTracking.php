<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Website;
use App\Models\TrafficHourlyStat;
use App\Models\User;
use App\Models\Setting;
use App\Notifications\TrackingCodeRemovedNotification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class VerifyWebsiteTracking extends Command
{
    protected $signature = 'tracking:verify {--website= : Specific website ID to scan}';
    protected $description = 'Verify that active websites still have the tracking script installed';

    public function handle()
    {
        $websiteId = $this->option('website');
        
        // Check scheduler logic if it is triggered by Laravel scheduler (not manual or single website check)
        if (!$websiteId) {
            $frequency = Setting::get('tracking_verify_frequency', 'hourly');
            $interval  = (int) Setting::get('tracking_verify_interval', 1);

            $lastRunTimestamp = Cache::get('tracking_verify_last_run');

            if ($lastRunTimestamp) {
                $lastRun = Carbon::parse($lastRunTimestamp);
                $nowTime = now();

                $shouldVerify = false;

                if ($frequency === 'daily') {
                    $tz        = Setting::get('platform_timezone', 'UTC');
                    $lastRunTz = $lastRun->copy()->setTimezone($tz);
                    $nowTimeTz = $nowTime->copy()->setTimezone($tz);

                    if ($lastRunTz->format('Y-m-d') !== $nowTimeTz->format('Y-m-d')) {
                        $shouldVerify = true;
                    }
                } elseif ($frequency === 'minutes') {
                    if (abs($nowTime->diffInSeconds($lastRun)) >= ($interval * 60 - 30)) {
                        $shouldVerify = true;
                    }
                } else {
                    // Hourly
                    if (abs($nowTime->diffInSeconds($lastRun)) >= ($interval * 3600 - 30)) {
                        $shouldVerify = true;
                    }
                }

                if (!$shouldVerify) {
                    $this->info("Tracking verification is not due yet. Skipping (Frequency: {$frequency}, Interval: {$interval}).");
                    return 0;
                }
            }

            Cache::put('tracking_verify_last_run', now()->toIso8601String());
        }

        $query = Website::where('is_active', true);
        if ($websiteId) {
            $query->where('id', $websiteId);
        }
        
        $websites = $query->get();
        $this->info("Scanning " . $websites->count() . " website(s)...");

        foreach ($websites as $website) {
            $this->verifyWebsite($website);
        }

        $this->info("Scan complete!");
        return 0;
    }

    private function verifyWebsite(Website $website)
    {
        $domain = $website->domain;
        // Strip protocols if they exist, to construct a clean target
        $domainClean = preg_replace('#^https?://#', '', $domain);
        
        $urlsToTry = [
            "https://{$domainClean}/",
            "https://{$domainClean}",
            "http://{$domainClean}/",
            "http://{$domainClean}"
        ];

        $userAgents = [
            'Chrome' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'WordPress' => "WordPress/6.4.2; https://{$domainClean}",
            'Googlebot' => 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Bingbot' => 'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
            'Safari' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
        ];

        $found = false;
        $html = '';
        $attemptsLog = [];
        $hasSuccessfulResponse = false;

        foreach ($urlsToTry as $url) {
            foreach ($userAgents as $uaName => $uaValue) {
                try {
                    $response = Http::withoutVerifying()
                        ->timeout(12)
                        ->withHeaders([
                            'User-Agent' => $uaValue,
                            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                            'Accept-Language' => 'en-US,en;q=0.9',
                            'Cache-Control' => 'no-cache',
                            'Pragma' => 'no-cache',
                        ])
                        ->get($url);

                    if ($response->successful()) {
                        $html = $response->body();
                        // Check if it is a block page
                        if ($this->isBlockPage($html)) {
                            $attemptsLog[] = "{$url} (UA: {$uaName}) -> Status: 200 (Blocked by WAF/Firewall Page)";
                        } else {
                            $hasSuccessfulResponse = true;
                            // Check if it contains the script name and the website id
                            if (str_contains($html, 'publisher-tracker.js') && str_contains($html, "data-website-id=\"{$website->id}\"")) {
                                $found = true;
                                break 2; // Found! Break out of both loops
                            } else {
                                $attemptsLog[] = "{$url} (UA: {$uaName}) -> Status: 200 (Script/ID not found)";
                            }
                        }
                    } else {
                        $attemptsLog[] = "{$url} (UA: {$uaName}) -> Status: " . $response->status();
                    }
                } catch (\Exception $e) {
                    $attemptsLog[] = "{$url} (UA: {$uaName}) -> Exception: " . $e->getMessage();
                }
            }
        }

        $oldStatus = $website->tracking_status;
        
        if ($found) {
            $newStatus = 'active';
        } elseif ($hasSuccessfulResponse) {
            // Successfully crawled the real page but the script tag was not found — genuinely missing.
            $newStatus = 'missing';
            $logMsg = "Tracking check failed for website {$domain} (ID: {$website->id}). Real page crawled but script was missing:\n" . implode("\n", $attemptsLog);
            Log::warning($logMsg);
        } else {
            // All crawl attempts were blocked/unreachable (WAF, firewall, 403, etc.).
            // Fall back to real visitor traffic as proof the tracking script is installed.
            $recentTrafficExists = TrafficHourlyStat::where('website_id', $website->id)
                ->where('date', '>=', now()->subHours(48)->toDateString())
                ->where('visits', '>', 0)
                ->exists();

            if ($recentTrafficExists) {
                // Real visitors fired the tracking script in the last 48h → script is working.
                $newStatus = 'active';
                Log::info("Tracking check for website {$domain} was blocked by WAF, but real traffic confirmed script is active. Marking as 'active'.");
            } elseif ($oldStatus === 'active') {
                // Site is blocked/unreachable but was previously confirmed active.
                // Preserve 'active' silently — this is expected for WAF-protected sites.
                $newStatus = 'active';
                Log::info("Tracking check for website {$domain} was blocked by WAF. Status preserved as 'active' (previously verified). No action needed.");
            } else {
                // No real traffic and status was already 'missing' — cannot confirm either way.
                // Preserve the current status and warn so admin can investigate.
                $newStatus = $oldStatus;
                $logMsg = "Tracking check unreachable/blocked for website {$domain} (ID: {$website->id}) and no recent traffic found. Preserved status '{$oldStatus}':\n" . implode("\n", $attemptsLog);
                Log::warning($logMsg);
            }
        }

        $website->tracking_status = $newStatus;
        $website->tracking_checked_at = now();
        $website->save();

        if ($newStatus === 'missing' && $oldStatus !== 'missing') {
            $this->notifyAdmins($website);
        }
    }

    private function isBlockPage(string $html): bool
    {
        $indicators = [
            'wordfence',
            'cloudflare',
            'recaptcha',
            'turnstile',
            'litespeed',
            'access restricted',
            'تم تقييد الوصول',
            'security check',
            'ddos protection',
            'sucuri',
            'security rules',
            'captcha',
            'waf block',
            'firewall',
        ];
        
        $htmlLower = mb_strtolower($html);
        foreach ($indicators as $indicator) {
            if (str_contains($htmlLower, $indicator)) {
                return true;
            }
        }
        
        return false;
    }

    private function notifyAdmins(Website $website)
    {
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $admin->notify(new TrackingCodeRemovedNotification($website));
        }
        
        Log::warning("Tracking script not found on {$website->domain}. Admin notification triggered.");
    }
}
