<?php

namespace App\Jobs;

use App\Models\Cashback;
use App\Services\CashbackService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessCashbackRetry implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Cashback $cashback
    ) {}

    public function handle(CashbackService $cashbackService): void
    {
        Log::info('Processing cashback retry job', [
            'cashback_id' => $this->cashback->id,
            'retry_count' => $this->cashback->retry_count
        ]);

        try {
            $cashbackService->retryCashbackPayment($this->cashback);
        } catch (\Exception $e) {
            Log::error('Cashback retry job failed', [
                'cashback_id' => $this->cashback->id,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Cashback retry job permanently failed', [
            'cashback_id' => $this->cashback->id,
            'exception' => $exception->getMessage()
        ]);
    }
}