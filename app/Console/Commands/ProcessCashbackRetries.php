<?php

namespace App\Console\Commands;

use App\Jobs\ProcessCashbackRetry;
use App\Services\CashbackService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessCashbackRetries extends Command
{
    protected $signature = 'cashback:process-retries';
    protected $description = 'Process failed cashback payments that are eligible for retry';

    public function handle(CashbackService $cashbackService): int
    {
        $this->info('Starting cashback retry processing...');

        $cashbacksToRetry = $cashbackService->getCashbacksForRetry();
        
        if ($cashbacksToRetry->isEmpty()) {
            $this->info('No cashbacks found for retry.');
            return Command::SUCCESS;
        }

        $this->info("Found {$cashbacksToRetry->count()} cashbacks to retry.");

        foreach ($cashbacksToRetry as $cashback) {
            try {
                ProcessCashbackRetry::dispatch($cashback);
                
                $this->info("Queued retry for cashback ID: {$cashback->id}");
                
                Log::info('Cashback retry queued', [
                    'cashback_id' => $cashback->id,
                    'retry_count' => $cashback->retry_count,
                    'user_id' => $cashback->user_id
                ]);
            } catch (\Exception $e) {
                $this->error("Failed to queue retry for cashback ID: {$cashback->id} - {$e->getMessage()}");
                
                Log::error('Failed to queue cashback retry', [
                    'cashback_id' => $cashback->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->info('Cashback retry processing completed.');
        return Command::SUCCESS;
    }
}