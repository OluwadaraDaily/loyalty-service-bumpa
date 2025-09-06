<?php

namespace App\Console\Commands;

use App\Services\InMemoryQueueService;
use Illuminate\Console\Command;

class SendTestPurchaseEvent extends Command
{
    protected $signature = 'loyalty:send-test-purchase 
                          {user_id : The user ID for the test purchase}
                          {amount : The purchase amount}
                          {--currency=NGN : Currency code}
                          {--method=credit_card : Payment method}';

    protected $description = 'Send a test purchase event to the in-memory queue for testing';

    public function handle(): int
    {
        $userId = $this->argument('user_id');
        $amount = $this->argument('amount');
        $currency = $this->option('currency');
        $paymentMethod = $this->option('method');

        if (!is_numeric($userId) || !is_numeric($amount)) {
            $this->error('User ID and amount must be numeric values');
            return 1;
        }

        $purchaseData = [
            'user_id' => (int) $userId,
            'amount' => (float) $amount,
            'currency' => $currency,
            'payment_method' => $paymentMethod,
            'payment_reference' => 'test_' . uniqid(),
            'status' => 'completed',
            'timestamp' => now()->toISOString(),
            'metadata' => [
                'source' => 'test_command',
                'generated_at' => now()->toISOString()
            ]
        ];

        try {
            InMemoryQueueService::addPurchaseEvent($purchaseData);
            
            $this->info('Test purchase event added to queue successfully!');
            $this->table(
                ['Field', 'Value'],
                [
                    ['User ID', $userId],
                    ['Amount', $amount . ' ' . $currency],
                    ['Payment Method', $paymentMethod],
                    ['Reference', $purchaseData['payment_reference']],
                ]
            );
            
        } catch (\Exception $e) {
            $this->error('Failed to add test purchase event: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}