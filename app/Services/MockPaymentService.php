<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MockPaymentService
{
    private array $config;

    public function __construct()
    {
        $this->config = [
            'success_rate' => config('payment.mock.success_rate', 0.8),
            'network_timeout_rate' => config('payment.mock.network_timeout_rate', 0.1),
            'insufficient_funds_rate' => config('payment.mock.insufficient_funds_rate', 0.05),
            'processing_delay_ms' => config('payment.mock.processing_delay_ms', [100, 500]),
        ];
    }

    public function initializeTransfer(array $transferData): array
    {
        $this->simulateProcessingDelay();

        $transactionReference = 'TXN_' . Str::upper(Str::random(12));
        
        Log::info('Mock payment transfer initiated', [
            'reference' => $transactionReference,
            'amount' => $transferData['amount'],
            'recipient' => $transferData['recipient'] ?? 'user',
            'currency' => $transferData['currency'] ?? 'NGN'
        ]);

        $outcome = $this->determineTransactionOutcome();

        switch ($outcome) {
            case 'success':
                return [
                    'success' => true,
                    'transaction_reference' => $transactionReference,
                    'status' => 'completed',
                    'message' => 'Transfer completed successfully',
                    'provider_response' => [
                        'transfer_code' => 'TRA_' . Str::random(10),
                        'status' => 'success',
                        'amount' => $transferData['amount'],
                        'currency' => $transferData['currency'] ?? 'NGN',
                        'transferred_at' => now()->toISOString()
                    ]
                ];

            case 'network_timeout':
                return [
                    'success' => false,
                    'transaction_reference' => $transactionReference,
                    'status' => 'failed',
                    'error_code' => 'NETWORK_TIMEOUT',
                    'message' => 'Network timeout occurred during transfer',
                    'retryable' => true,
                    'provider_response' => [
                        'error' => 'Request timed out',
                        'error_code' => 'TIMEOUT_ERROR'
                    ]
                ];

            case 'insufficient_funds':
                return [
                    'success' => false,
                    'transaction_reference' => $transactionReference,
                    'status' => 'failed',
                    'error_code' => 'INSUFFICIENT_FUNDS',
                    'message' => 'Insufficient funds in merchant account',
                    'retryable' => false,
                    'provider_response' => [
                        'error' => 'Insufficient account balance',
                        'error_code' => 'INSUFFICIENT_BALANCE'
                    ]
                ];

            case 'service_unavailable':
                return [
                    'success' => false,
                    'transaction_reference' => $transactionReference,
                    'status' => 'failed',
                    'error_code' => 'SERVICE_UNAVAILABLE',
                    'message' => 'Payment service temporarily unavailable',
                    'retryable' => true,
                    'provider_response' => [
                        'error' => 'Service temporarily unavailable',
                        'error_code' => 'SERVICE_DOWN'
                    ]
                ];

            default:
                return [
                    'success' => false,
                    'transaction_reference' => $transactionReference,
                    'status' => 'failed',
                    'error_code' => 'UNKNOWN_ERROR',
                    'message' => 'An unknown error occurred',
                    'retryable' => true,
                    'provider_response' => [
                        'error' => 'Unknown error occurred',
                        'error_code' => 'UNKNOWN'
                    ]
                ];
        }
    }

    public function verifyTransaction(string $transactionReference): array
    {
        $this->simulateProcessingDelay();

        Log::info('Mock payment verification requested', [
            'reference' => $transactionReference
        ]);

        if (Str::startsWith($transactionReference, 'TXN_')) {
            $rand = mt_rand(1, 100);
            
            if ($rand <= 85) {
                return [
                    'success' => true,
                    'transaction_reference' => $transactionReference,
                    'status' => 'completed',
                    'verified_at' => now()->toISOString(),
                    'provider_response' => [
                        'status' => 'success',
                        'verified' => true
                    ]
                ];
            } elseif ($rand <= 95) {
                return [
                    'success' => false,
                    'transaction_reference' => $transactionReference,
                    'status' => 'pending',
                    'message' => 'Transaction still processing',
                    'provider_response' => [
                        'status' => 'pending',
                        'verified' => false
                    ]
                ];
            } else {
                return [
                    'success' => false,
                    'transaction_reference' => $transactionReference,
                    'status' => 'failed',
                    'message' => 'Transaction verification failed',
                    'provider_response' => [
                        'status' => 'failed',
                        'verified' => false
                    ]
                ];
            }
        }

        return [
            'success' => false,
            'transaction_reference' => $transactionReference,
            'status' => 'not_found',
            'message' => 'Transaction not found',
            'provider_response' => [
                'error' => 'Transaction reference not found',
                'error_code' => 'NOT_FOUND'
            ]
        ];
    }

    public function getProviderName(): string
    {
        return 'mock';
    }

    public function isRetryableError(string $errorCode): bool
    {
        return in_array($errorCode, [
            'NETWORK_TIMEOUT',
            'SERVICE_UNAVAILABLE',
            'UNKNOWN_ERROR'
        ]);
    }

    private function determineTransactionOutcome(): string
    {
        $rand = mt_rand(1, 100) / 100;
        
        if ($rand <= $this->config['success_rate']) {
            return 'success';
        }
        
        $rand -= $this->config['success_rate'];
        
        if ($rand <= $this->config['network_timeout_rate']) {
            return 'network_timeout';
        }
        
        $rand -= $this->config['network_timeout_rate'];
        
        if ($rand <= $this->config['insufficient_funds_rate']) {
            return 'insufficient_funds';
        }
        
        return 'service_unavailable';
    }

    private function simulateProcessingDelay(): void
    {
        $delayRange = $this->config['processing_delay_ms'];
        $delayMs = mt_rand($delayRange[0], $delayRange[1]);
        
        usleep($delayMs * 1000);
    }

    public function simulateWebhook(string $transactionReference, string $status = 'success'): array
    {
        return [
            'event' => 'transfer.success',
            'data' => [
                'reference' => $transactionReference,
                'status' => $status,
                'amount' => 1000,
                'currency' => 'NGN',
                'transferred_at' => now()->toISOString(),
                'reason' => $status === 'success' ? 'Transfer completed' : 'Transfer failed'
            ]
        ];
    }
}