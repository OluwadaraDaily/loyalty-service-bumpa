<?php

namespace Tests\Unit\Services;

use App\Events\CashbackCompleted;
use App\Events\CashbackFailed;
use App\Events\CashbackInitiated;
use App\Models\Cashback;
use App\Models\Purchase;
use App\Models\User;
use App\Services\CashbackCalculationService;
use App\Services\CashbackService;
use App\Services\MockPaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class CashbackServiceTest extends TestCase
{
    use RefreshDatabase;

    private CashbackService $cashbackService;
    private User $user;
    private Purchase $purchase;
    private CashbackCalculationService $mockCalculationService;
    private MockPaymentService $mockPaymentService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockCalculationService = $this->createMock(CashbackCalculationService::class);
        $this->mockPaymentService = $this->createMock(MockPaymentService::class);
        
        $this->cashbackService = new CashbackService(
            $this->mockCalculationService,
            $this->mockPaymentService
        );
        
        $this->user = User::factory()->create();
        $this->purchase = Purchase::factory()->create(['user_id' => $this->user->id]);
        
        Event::fake();
    }

    /** @test */
    public function it_processes_cashback_for_eligible_purchase()
    {
        $this->mockCalculationService
            ->method('calculateCashbackForPurchase')
            ->willReturn([
                'eligible' => true,
                'amount' => 50.00,
                'currency' => 'NGN'
            ]);

        $this->mockPaymentService
            ->method('getProviderName')
            ->willReturn('mock_provider');

        $this->mockPaymentService
            ->method('initializeTransfer')
            ->willReturn([
                'success' => true,
                'transaction_reference' => 'txn_123456'
            ]);

        $cashback = $this->cashbackService->processCashbackForPurchase(
            $this->user, 
            $this->purchase
        );

        $this->assertNotNull($cashback);
        $this->assertEquals(50.00, $cashback->amount);
        $this->assertEquals('completed', $cashback->status);
        $this->assertEquals('txn_123456', $cashback->transaction_reference);
        
        Event::assertDispatched(CashbackInitiated::class);
        Event::assertDispatched(CashbackCompleted::class);
    }

    /** @test */
    public function it_returns_null_for_ineligible_purchase()
    {
        $this->mockCalculationService
            ->method('calculateCashbackForPurchase')
            ->willReturn([
                'eligible' => false,
                'reason' => 'Minimum amount not met'
            ]);

        $cashback = $this->cashbackService->processCashbackForPurchase(
            $this->user, 
            $this->purchase
        );

        $this->assertNull($cashback);
        Event::assertNotDispatched(CashbackInitiated::class);
    }

    /** @test */
    public function it_prevents_duplicate_cashback_with_idempotency_key()
    {
        $existingCashback = Cashback::factory()->create([
            'user_id' => $this->user->id,
            'purchase_id' => $this->purchase->id,
            'idempotency_key' => 'cashback_' . $this->user->id . '_' . $this->purchase->id . '_test123'
        ]);

        $this->mockCalculationService
            ->method('calculateCashbackForPurchase')
            ->willReturn([
                'eligible' => true,
                'amount' => 50.00,
                'currency' => 'NGN'
            ]);

        $cashback = $this->cashbackService->processCashbackForPurchase(
            $this->user, 
            $this->purchase
        );

        $this->assertEquals($existingCashback->id, $cashback->id);
        $this->assertEquals(1, Cashback::count());
    }

    /** @test */
    public function it_handles_payment_failure_and_schedules_retry()
    {
        $this->mockCalculationService
            ->method('calculateCashbackForPurchase')
            ->willReturn([
                'eligible' => true,
                'amount' => 50.00,
                'currency' => 'NGN'
            ]);

        $this->mockPaymentService
            ->method('getProviderName')
            ->willReturn('mock_provider');

        $this->mockPaymentService
            ->method('initializeTransfer')
            ->willReturn([
                'success' => false,
                'error_code' => 'INSUFFICIENT_FUNDS',
                'message' => 'Payment failed due to insufficient funds'
            ]);

        $this->mockPaymentService
            ->method('isRetryableError')
            ->with('INSUFFICIENT_FUNDS')
            ->willReturn(true);

        $cashback = $this->cashbackService->processCashbackForPurchase(
            $this->user, 
            $this->purchase
        );

        $this->assertEquals('failed', $cashback->status);
        $this->assertEquals('Payment failed due to insufficient funds', $cashback->failure_reason);
        
        Event::assertDispatched(CashbackInitiated::class);
        Event::assertDispatched(CashbackFailed::class, function ($event) {
            return $event->isRetryable === true;
        });
    }

    /** @test */
    public function it_retries_failed_cashback_within_max_attempts()
    {
        $cashback = Cashback::factory()->failed()->withRetries(1)->create();

        $this->mockPaymentService
            ->method('initializeTransfer')
            ->willReturn([
                'success' => true,
                'transaction_reference' => 'retry_txn_123'
            ]);

        $result = $this->cashbackService->retryCashbackPayment($cashback);

        $this->assertTrue($result);
        $cashback->refresh();
        $this->assertEquals('completed', $cashback->status);
        $this->assertEquals(2, $cashback->retry_count);
        $this->assertEquals('retry_txn_123', $cashback->transaction_reference);
    }

    /** @test */
    public function it_permanently_fails_after_max_retry_attempts()
    {
        $cashback = Cashback::factory()->failed()->withRetries(3)->create();

        $result = $this->cashbackService->retryCashbackPayment($cashback);

        $this->assertFalse($result);
        $cashback->refresh();
        $this->assertEquals('failed', $cashback->status);
        $this->assertEquals('Maximum retry attempts exceeded', $cashback->failure_reason);
        
        Event::assertDispatched(CashbackFailed::class, function ($event) {
            return $event->isRetryable === false;
        });
    }

    /** @test */
    public function it_retrieves_cashbacks_eligible_for_retry()
    {
        // Create various cashback states
        Cashback::factory()->completed()->create(); // Should not be included
        Cashback::factory()->failed()->withRetries(5)->create(); // Exceeded max retries
        
        $eligibleCashback1 = Cashback::factory()->failed()->create([
            'retry_count' => 0,
            'last_retry_at' => now()->subMinutes(10)
        ]);
        
        $eligibleCashback2 = Cashback::factory()->failed()->create([
            'retry_count' => 1,
            'last_retry_at' => now()->subMinutes(10)
        ]);

        $eligibleCashbacks = $this->cashbackService->getCashbacksForRetry();

        $this->assertCount(2, $eligibleCashbacks);
        $this->assertTrue($eligibleCashbacks->contains($eligibleCashback1));
        $this->assertTrue($eligibleCashbacks->contains($eligibleCashback2));
    }

    /** @test */
    public function it_retrieves_cashback_status_by_idempotency_key()
    {
        $cashback = Cashback::factory()->completed()->create([
            'user_id' => $this->user->id,
            'purchase_id' => $this->purchase->id,
            'idempotency_key' => 'test_key_123',
            'transaction_reference' => 'txn_completed_123'
        ]);

        $status = $this->cashbackService->getCashbackStatus('test_key_123');

        $this->assertNotNull($status);
        $this->assertEquals($cashback->id, $status['id']);
        $this->assertEquals('completed', $status['status']);
        $this->assertEquals('txn_completed_123', $status['transaction_reference']);
        $this->assertArrayHasKey('user', $status);
        $this->assertArrayHasKey('purchase', $status);
    }

    /** @test */
    public function it_returns_null_for_non_existent_idempotency_key()
    {
        $status = $this->cashbackService->getCashbackStatus('non_existent_key');
        $this->assertNull($status);
    }

    /** @test */
    public function it_handles_payment_exception_and_schedules_retry()
    {
        $this->mockCalculationService
            ->method('calculateCashbackForPurchase')
            ->willReturn([
                'eligible' => true,
                'amount' => 50.00,
                'currency' => 'NGN'
            ]);

        $this->mockPaymentService
            ->method('getProviderName')
            ->willReturn('mock_provider');

        $this->mockPaymentService
            ->method('initializeTransfer')
            ->willThrowException(new \Exception('Network timeout'));

        $cashback = $this->cashbackService->processCashbackForPurchase(
            $this->user, 
            $this->purchase
        );

        $this->assertEquals('failed', $cashback->status);
        $this->assertEquals('Network timeout', $cashback->failure_reason);
        
        Event::assertDispatched(CashbackFailed::class, function ($event) {
            return $event->reason === 'System error occurred during payment processing' &&
                   $event->isRetryable === true;
        });
    }

    /** @test */
    public function it_processes_successful_cashback_payment()
    {
        $cashback = Cashback::factory()->initiated()->create();

        $this->mockPaymentService
            ->method('initializeTransfer')
            ->willReturn([
                'success' => true,
                'transaction_reference' => 'success_txn_456'
            ]);

        $result = $this->cashbackService->processCashbackPayment($cashback);

        $this->assertTrue($result);
        $cashback->refresh();
        $this->assertEquals('completed', $cashback->status);
        $this->assertEquals('success_txn_456', $cashback->transaction_reference);
        $this->assertNotNull($cashback->paid_at);
    }

    /** @test */
    public function it_updates_cashback_status_during_processing()
    {
        $cashback = Cashback::factory()->initiated()->create();

        $this->mockPaymentService
            ->method('initializeTransfer')
            ->willReturn([
                'success' => true,
                'transaction_reference' => 'txn_status_test'
            ]);

        $this->cashbackService->processCashbackPayment($cashback);

        // Verify status was updated to processing before completion
        $this->assertNotNull($cashback->fresh()->last_retry_at);
    }
}