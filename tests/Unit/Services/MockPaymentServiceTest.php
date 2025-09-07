<?php

namespace Tests\Unit\Services;

use App\Services\MockPaymentService;
use Tests\TestCase;

class MockPaymentServiceTest extends TestCase
{
    private MockPaymentService $paymentService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->paymentService = new MockPaymentService();
    }

    /** @test */
    public function it_returns_valid_response_structure()
    {
        $transferData = [
            'amount' => 100.00,
            'currency' => 'NGN',
            'recipient' => ['email' => 'user@test.com'],
            'reference' => 'test_ref_123'
        ];

        $result = $this->paymentService->initializeTransfer($transferData);

        // Test response structure
        $this->assertArrayHasKey('success', $result);
        $this->assertArrayHasKey('transaction_reference', $result);
        $this->assertArrayHasKey('status', $result);
        $this->assertArrayHasKey('message', $result);
        $this->assertStringStartsWith('TXN_', $result['transaction_reference']);
        
        if (!$result['success']) {
            $this->assertArrayHasKey('error_code', $result);
        }
    }

    /** @test */
    public function it_generates_unique_transaction_references()
    {
        $transferData = [
            'amount' => 100.00,
            'currency' => 'NGN',
            'recipient' => ['email' => 'user@test.com'],
            'reference' => 'test_ref_unique'
        ];

        $result1 = $this->paymentService->initializeTransfer($transferData);
        $result2 = $this->paymentService->initializeTransfer($transferData);

        $this->assertNotEquals(
            $result1['transaction_reference'], 
            $result2['transaction_reference']
        );
    }

    /** @test */
    public function it_identifies_retryable_errors_correctly()
    {
        $retryableErrors = ['NETWORK_TIMEOUT', 'SERVICE_UNAVAILABLE', 'UNKNOWN_ERROR'];
        $nonRetryableErrors = ['INSUFFICIENT_FUNDS'];

        foreach ($retryableErrors as $error) {
            $this->assertTrue(
                $this->paymentService->isRetryableError($error),
                "Expected {$error} to be retryable"
            );
        }

        foreach ($nonRetryableErrors as $error) {
            $this->assertFalse(
                $this->paymentService->isRetryableError($error),
                "Expected {$error} to not be retryable"
            );
        }
    }

    /** @test */
    public function it_returns_correct_provider_name()
    {
        $this->assertEquals('mock', $this->paymentService->getProviderName());
    }

    /** @test */
    public function it_defaults_unknown_errors_to_non_retryable()
    {
        $unknownError = 'UNKNOWN_ERROR_CODE_123';
        $this->assertFalse($this->paymentService->isRetryableError($unknownError));
    }

    /** @test */
    public function it_simulates_various_outcomes()
    {
        $successCount = 0;
        $failureCount = 0;
        $attempts = 20;
        
        for ($i = 0; $i < $attempts; $i++) {
            $transferData = [
                'amount' => 100.00,
                'currency' => 'NGN',
                'recipient' => ['email' => 'user@test.com'],
                'reference' => "test_ref_{$i}"
            ];

            $result = $this->paymentService->initializeTransfer($transferData);
            
            if ($result['success']) {
                $successCount++;
                $this->assertEquals('completed', $result['status']);
            } else {
                $failureCount++;
                $this->assertEquals('failed', $result['status']);
                $this->assertContains($result['error_code'], [
                    'INSUFFICIENT_FUNDS', 
                    'NETWORK_TIMEOUT', 
                    'SERVICE_UNAVAILABLE'
                ]);
            }
        }
        
        // Should have both successes and failures
        $this->assertGreaterThan(0, $successCount);
        $this->assertGreaterThan(0, $failureCount);
    }

    /** @test */
    public function it_handles_minimal_transfer_data()
    {
        $transferData = [
            'amount' => 50.00,
        ];

        $result = $this->paymentService->initializeTransfer($transferData);

        // Should still return valid response structure
        $this->assertArrayHasKey('success', $result);
        $this->assertArrayHasKey('transaction_reference', $result);
    }

    /** @test */
    public function it_verifies_transactions()
    {
        $transactionReference = 'TXN_TEST123456789';
        
        $result = $this->paymentService->verifyTransaction($transactionReference);
        
        $this->assertArrayHasKey('success', $result);
        $this->assertArrayHasKey('transaction_reference', $result);
        $this->assertArrayHasKey('status', $result);
        $this->assertEquals($transactionReference, $result['transaction_reference']);
    }

    /** @test */
    public function it_simulates_webhooks()
    {
        $transactionReference = 'TXN_WEBHOOK123';
        
        $webhook = $this->paymentService->simulateWebhook($transactionReference);
        
        $this->assertArrayHasKey('event', $webhook);
        $this->assertArrayHasKey('data', $webhook);
        $this->assertEquals('transfer.success', $webhook['event']);
        $this->assertEquals($transactionReference, $webhook['data']['reference']);
    }
}