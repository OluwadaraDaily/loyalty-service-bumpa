<?php

namespace App\Console\Commands;

use App\Services\InMemoryQueueService;
use Illuminate\Console\Command;

class ProcessQueueEvents extends Command
{
    protected $signature = 'loyalty:process-queue';

    protected $description = 'Process purchase events from the in-memory queue for loyalty rewards';

    private InMemoryQueueService $queueService;

    public function __construct(InMemoryQueueService $queueService)
    {
        parent::__construct();
        $this->queueService = $queueService;
    }

    public function handle(): int
    {
        $queueSize = $this->queueService->getQueueSize();
        
        if ($queueSize === 0) {
            $this->info('No events in queue to process.');
            return 0;
        }

        $this->info("Processing {$queueSize} events from queue...");
        
        $this->queueService->processQueue();
        
        $this->info('Queue processing completed!');
        
        return 0;
    }
}