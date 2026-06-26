<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\TrafficHourlyStat;
use App\Models\TrafficDailyStat;
use App\Models\TrafficQualityScore;
use App\Models\TrafficAnomaly;
use Illuminate\Support\Facades\Log;

class PruneOldTrafficData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'traffic:prune';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Prune old traffic intelligence data (hourly stats > 30 days, daily stats/quality scores/anomalies > 90 days) to optimize database size';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting traffic data pruning...');
        Log::info('PruneOldTrafficData: Starting pruning process');

        $hourlyCutoff = now()->subDays(30)->toDateString();
        $dailyCutoff = now()->subDays(90)->toDateString();
        $anomalyCutoff = now()->subDays(90)->toDateTimeString();

        // 1. Hourly Stats (older than 30 days)
        $deletedHourly = TrafficHourlyStat::where('date', '<', $hourlyCutoff)->delete();
        $this->info("Deleted {$deletedHourly} hourly traffic records (older than {$hourlyCutoff}).");

        // 2. Daily Stats (older than 90 days)
        $deletedDaily = TrafficDailyStat::where('date', '<', $dailyCutoff)->delete();
        $this->info("Deleted {$deletedDaily} daily traffic records (older than {$dailyCutoff}).");

        // 3. Quality Scores (older than 90 days)
        $deletedQuality = TrafficQualityScore::where('date', '<', $dailyCutoff)->delete();
        $this->info("Deleted {$deletedQuality} traffic quality scores (older than {$dailyCutoff}).");

        // 4. Anomalies (older than 90 days)
        $deletedAnomalies = TrafficAnomaly::where('detected_at', '<', $anomalyCutoff)->delete();
        $this->info("Deleted {$deletedAnomalies} traffic anomalies (older than {$anomalyCutoff}).");

        Log::info(sprintf(
            'PruneOldTrafficData: Pruned %d hourly, %d daily, %d quality scores, and %d anomalies.',
            $deletedHourly,
            $deletedDaily,
            $deletedQuality,
            $deletedAnomalies
        ));

        $this->info('Traffic data pruning completed successfully.');
        return 0;
    }
}
