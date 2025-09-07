<?php

namespace Tests\Feature\Events;

use App\Events\AchievementUnlocked;
use App\Events\BadgeUnlocked;
use App\Events\CashbackInitiated;
use App\Models\Achievement;
use App\Models\Badge;
use App\Models\User;
use App\Services\InMemoryQueueService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class QueueProcessingTest extends TestCase
{
    use RefreshDatabase;

    private InMemoryQueueService $queueService;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->queueService = app(InMemoryQueueService::class);
        $this->user = User::factory()->create();
        
        // Create achievements and badges
        Achievement::factory()->firstPurchase()->create();
        Badge::factory()->create();
        
        Event::fake();
    }

    /** @test */
    public function it_processes_purchase_events_from_queue()
    {
        $purchaseEvent = [
            'user_id' => $this->user->id,
            'amount' => 100.00,
            'currency' => 'NGN',
            'payment_method' => 'card',
            'payment_reference' => 'queue_test_123',
            'status' => 'completed',
            'timestamp' => now()->toISOString(),
            'metadata' => ['product' => 'Queue Test Product']
        ];

        InMemoryQueueService::addPurchaseEvent($purchaseEvent);

        $results = $this->queueService->processQueue();

        $this->assertCount(1, $results);
        $this->assertTrue($results[0]['success']);
        
        // Verify purchase was created
        $this->assertDatabaseHas('purchases', [
            'user_id' => $this->user->id,
            'payment_reference' => 'queue_test_123'
        ]);
        
        // Verify events were dispatched
        Event::assertDispatched(AchievementUnlocked::class);
        Event::assertDispatched(CashbackInitiated::class);
    }

    /** @test */
    public function it_processes_multiple_events_in_batch()
    {
        $users = User::factory()->count(3)->create();
        
        foreach ($users as $index => $user) {
            InMemoryQueueService::addPurchaseEvent([
                'user_id' => $user->id,
                'amount' => 100.00 + ($index * 50),
                'currency' => 'NGN',
                'payment_method' => 'card',
                'payment_reference' => "batch_test_{$index}",
                'status' => 'completed'
            ]);
        }

        $results = $this->queueService->processQueue();

        $this->assertCount(3, $results);
        foreach ($results as $result) {
            $this->assertTrue($result['success']);
        }

        // Verify all purchases were created
        foreach ($users as $index => $user) {
            $this->assertDatabaseHas('purchases', [
                'user_id' => $user->id,
                'payment_reference' => "batch_test_{$index}"
            ]);
        }
    }

    /** @test */
    public function it_handles_invalid_queue_events_gracefully()
    {
        // Add invalid event (missing user_id)
        InMemoryQueueService::addPurchaseEvent([
            'amount' => 100.00,
            'currency' => 'NGN'
        ]);

        $results = $this->queueService->processQueue();

        $this->assertCount(1, $results);
        $this->assertFalse($results[0]['success']);
        $this->assertArrayHasKey('error', $results[0]);
        $this->assertEquals('User not found', $results[0]['error']);
    }

    /** @test */
    public function it_persists_queue_state_between_requests()
    {
        InMemoryQueueService::addPurchaseEvent([
            'user_id' => $this->user->id,
            'amount' => 100.00,
            'payment_reference' => 'persist_test_123'
        ]);

        // Create new instance to simulate new request
        $newQueueService = app(InMemoryQueueService::class);
        $queueSize = $newQueueService->getQueueSize();

        // Queue should persist
        $this->assertEquals(1, $queueSize);
    }

    /** @test */
    public function it_clears_processed_events_from_queue()
    {
        InMemoryQueueService::addPurchaseEvent([
            'user_id' => $this->user->id,
            'amount' => 100.00,
            'payment_reference' => 'clear_test_123'
        ]);

        $this->assertEquals(1, $this->queueService->getQueueSize());

        $this->queueService->processQueue();

        $this->assertEquals(0, $this->queueService->getQueueSize());
    }

    /** @test */
    public function it_handles_queue_processing_exceptions()
    {
        // Add event with invalid data that might cause processing errors
        InMemoryQueueService::addPurchaseEvent([
            'user_id' => 'invalid_user_id', // String instead of int
            'amount' => 'invalid_amount', // String instead of number
            'currency' => 'NGN'
        ]);

        $results = $this->queueService->processQueue();

        $this->assertCount(1, $results);
        $this->assertFalse($results[0]['success']);
        $this->assertArrayHasKey('error', $results[0]);
    }

    /** @test */
    public function it_processes_events_with_different_currencies()
    {
        $events = [
            [
                'user_id' => $this->user->id,
                'amount' => 100.00,
                'currency' => 'NGN',
                'payment_reference' => 'ngn_test_123'
            ],
            [
                'user_id' => $this->user->id,
                'amount' => 50.00,
                'currency' => 'USD',
                'payment_reference' => 'usd_test_123'
            ]
        ];

        foreach ($events as $event) {
            InMemoryQueueService::addPurchaseEvent($event);
        }

        $results = $this->queueService->processQueue();

        $this->assertCount(2, $results);
        foreach ($results as $result) {
            $this->assertTrue($result['success']);
        }

        // Verify both purchases were created with correct currencies
        $this->assertDatabaseHas('purchases', [
            'user_id' => $this->user->id,
            'currency' => 'NGN',
            'payment_reference' => 'ngn_test_123'
        ]);
        
        $this->assertDatabaseHas('purchases', [
            'user_id' => $this->user->id,
            'currency' => 'USD',
            'payment_reference' => 'usd_test_123'
        ]);
    }

    /** @test */
    public function it_maintains_event_processing_order()
    {
        $events = [];
        for ($i = 1; $i <= 5; $i++) {
            $events[] = [
                'user_id' => $this->user->id,
                'amount' => $i * 10,
                'payment_reference' => "order_test_{$i}",
                'metadata' => ['sequence' => $i]
            ];
        }

        foreach ($events as $event) {
            InMemoryQueueService::addPurchaseEvent($event);
        }

        $results = $this->queueService->processQueue();

        $this->assertCount(5, $results);
        
        // Verify events were processed in order by checking purchase creation times
        $purchases = $this->user->purchases()
                               ->whereIn('payment_reference', collect($events)->pluck('payment_reference'))
                               ->orderBy('created_at')
                               ->get();

        $this->assertCount(5, $purchases);
        for ($i = 0; $i < 5; $i++) {
            $this->assertEquals("order_test_{$i + 1}", $purchases[$i]->payment_reference);
        }
    }

    /** @test */
    public function it_handles_empty_queue_gracefully()
    {
        $results = $this->queueService->processQueue();
        
        $this->assertIsArray($results);
        $this->assertCount(0, $results);
    }

    /** @test */
    public function it_processes_events_with_metadata()
    {
        InMemoryQueueService::addPurchaseEvent([
            'user_id' => $this->user->id,
            'amount' => 100.00,
            'payment_reference' => 'metadata_test_123',
            'metadata' => [
                'product_name' => 'Premium Product',
                'category' => 'Electronics',
                'discount_applied' => true,
                'discount_amount' => 20.00
            ]
        ]);

        $results = $this->queueService->processQueue();

        $this->assertTrue($results[0]['success']);
        
        $purchase = $this->user->purchases()
                              ->where('payment_reference', 'metadata_test_123')
                              ->first();
        
        $this->assertNotNull($purchase);
        $this->assertEquals('Premium Product', $purchase->metadata['product_name']);
        $this->assertTrue($purchase->metadata['discount_applied']);
    }

    /** @test */
    public function it_tracks_newly_unlocked_items_in_results()
    {
        InMemoryQueueService::addPurchaseEvent([
            'user_id' => $this->user->id,
            'amount' => 100.00,
            'payment_reference' => 'unlock_tracking_test'
        ]);

        $results = $this->queueService->processQueue();

        $this->assertTrue($results[0]['success']);
        $this->assertArrayHasKey('newly_unlocked_achievements', $results[0]);
        $this->assertArrayHasKey('newly_unlocked_badges', $results[0]);
        
        // Should have unlocked the first purchase achievement
        $this->assertCount(1, $results[0]['newly_unlocked_achievements']);
    }

    /** @test */
    public function it_handles_concurrent_queue_operations()
    {
        // Simulate adding events while processing (though actual concurrency would need threading)
        InMemoryQueueService::addPurchaseEvent([
            'user_id' => $this->user->id,
            'amount' => 100.00,
            'payment_reference' => 'concurrent_test_1'
        ]);

        // Start processing
        $initialSize = $this->queueService->getQueueSize();
        $this->assertEquals(1, $initialSize);

        // Add another event before processing completes
        InMemoryQueueService::addPurchaseEvent([
            'user_id' => $this->user->id,
            'amount' => 150.00,
            'payment_reference' => 'concurrent_test_2'
        ]);

        // Process queue
        $results = $this->queueService->processQueue();

        // Should process both events
        $this->assertCount(2, $results);
        $this->assertEquals(0, $this->queueService->getQueueSize());
    }
}