<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class InMemoryQueueService
{
    private const QUEUE_FILE = 'purchase_queue.json';
    private LoyaltyService $loyaltyService;

    public function __construct(LoyaltyService $loyaltyService)
    {
        $this->loyaltyService = $loyaltyService;
    }

    public static function addPurchaseEvent(array $purchaseData): void
    {
        $queue = self::getQueue();
        $queue[] = $purchaseData;
        self::saveQueue($queue);
        Log::info('Purchase event added to queue', ['data' => $purchaseData]);
    }

    public function processQueue(): array
    {
        $queue = self::getQueue();
        Log::info('Processing queue', ['count' => count($queue)]);

        $results = [];
        foreach ($queue as $purchaseData) {
            try {
                Log::debug('Processing purchase event from queue', ['data' => $purchaseData]);
                $result = $this->loyaltyService->processPurchaseEvent($purchaseData);
                $results[] = $result;
                
            } catch (\Exception $e) {
                Log::error('Error processing purchase event from queue', [
                    'error' => $e->getMessage(),
                    'data' => $purchaseData
                ]);
                $results[] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                    'purchase_data' => $purchaseData
                ];
            }
        }

        // Clear queue after processing
        self::clearQueue();
        
        return $results;
    }

    public function getQueueSize(): int
    {
        return count(self::getQueue());
    }

    public static function clearQueue(): void
    {
        self::saveQueue([]);
        Log::info('Queue cleared');
    }

    private static function getQueue(): array
    {
        if (!Storage::exists(self::QUEUE_FILE)) {
            return [];
        }

        $content = Storage::get(self::QUEUE_FILE);
        return json_decode($content, true) ?? [];
    }

    private static function saveQueue(array $queue): void
    {
        Storage::put(self::QUEUE_FILE, json_encode($queue));
    }
}