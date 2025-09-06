<?php

namespace App\Services;

use App\Events\CashbackCompleted;
use App\Events\CashbackFailed;
use App\Events\CashbackInitiated;
use App\Models\Cashback;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CashbackService
{
    private CashbackCalculationService $calculationService;
    private MockPaymentService $paymentService;
    private array $retryConfig;

    public function __construct(
        CashbackCalculationService $calculationService,
        MockPaymentService $paymentService
    ) {
        $this->calculationService = $calculationService;
        $this->paymentService = $paymentService;
        $this->retryConfig = config('payment.cashback.retry', []);
    }

    public function processCashbackForPurchase(User $user, Purchase $purchase, array $newlyUnlockedAchievements = [], array $newlyUnlockedBadges = []): ?Cashback
    {
        try {
            $cashbackCalculation = $this->calculationService->calculateCashbackForPurchase($user, $purchase, $newlyUnlockedAchievements, $newlyUnlockedBadges);

            if (!$cashbackCalculation['eligible']) {
                Log::info('User not eligible for cashback', [
                    'user_id' => $user->id,
                    'purchase_id' => $purchase->id,
                    'reason' => $cashbackCalculation['reason'] ?? 'Unknown reason'
                ]);
                return null;
            }

            DB::beginTransaction();

            $idempotencyKey = $this->generateIdempotencyKey($user->id, $purchase->id);
            
            $existingCashback = Cashback::where('idempotency_key', $idempotencyKey)->first();
            if ($existingCashback) {
                Log::info('Cashback already exists for this purchase', [
                    'cashback_id' => $existingCashback->id,
                    'idempotency_key' => $idempotencyKey
                ]);
                DB::rollback();
                return $existingCashback;
            }

            $cashback = Cashback::create([
                'user_id' => $user->id,
                'purchase_id' => $purchase->id,
                'amount' => $cashbackCalculation['amount'],
                'currency' => $cashbackCalculation['currency'],
                'idempotency_key' => $idempotencyKey,
                'payment_provider' => $this->paymentService->getProviderName(),
                'status' => 'initiated',
                'retry_count' => 0
            ]);

            DB::commit();

            event(new CashbackInitiated($user, $cashback));

            $this->processCashbackPayment($cashback);

            return $cashback;

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Failed to process cashback for purchase', [
                'user_id' => $user->id,
                'purchase_id' => $purchase->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    public function processCashbackPayment(Cashback $cashback): bool
    {
        try {
            $cashback->update([
                'status' => 'processing',
                'last_retry_at' => now()
            ]);

            $transferData = [
                'amount' => $cashback->amount,
                'currency' => $cashback->currency,
                'recipient' => [
                    'user_id' => $cashback->user_id,
                    'email' => $cashback->user->email ?? 'user@example.com',
                ],
                'reference' => $cashback->idempotency_key,
                'metadata' => [
                    'cashback_id' => $cashback->id,
                    'purchase_id' => $cashback->purchase_id,
                    'type' => 'cashback_payment'
                ]
            ];

            $paymentResponse = $this->paymentService->initializeTransfer($transferData);

            if ($paymentResponse['success']) {
                $cashback->update([
                    'status' => 'completed',
                    'transaction_reference' => $paymentResponse['transaction_reference'],
                    'paid_at' => now(),
                    'failure_reason' => null
                ]);

                event(new CashbackCompleted($cashback->user, $cashback, $paymentResponse));

                Log::info('Cashback payment completed successfully', [
                    'cashback_id' => $cashback->id,
                    'transaction_reference' => $paymentResponse['transaction_reference'],
                    'amount' => $cashback->amount
                ]);

                return true;
            } else {
                $this->handlePaymentFailure($cashback, $paymentResponse);
                return false;
            }

        } catch (\Exception $e) {
            $this->handlePaymentException($cashback, $e);
            return false;
        }
    }

    public function retryCashbackPayment(Cashback $cashback): bool
    {
        $maxAttempts = $this->retryConfig['max_attempts'] ?? 3;

        if ($cashback->retry_count >= $maxAttempts) {
            $cashback->update([
                'status' => 'failed',
                'failure_reason' => 'Maximum retry attempts exceeded'
            ]);

            event(new CashbackFailed(
                $cashback->user, 
                $cashback, 
                'Maximum retry attempts exceeded',
                false
            ));

            Log::warning('Cashback payment permanently failed - max retries exceeded', [
                'cashback_id' => $cashback->id,
                'retry_count' => $cashback->retry_count,
                'max_attempts' => $maxAttempts
            ]);

            return false;
        }

        $cashback->increment('retry_count');
        
        Log::info('Retrying cashback payment', [
            'cashback_id' => $cashback->id,
            'retry_count' => $cashback->retry_count,
            'max_attempts' => $maxAttempts
        ]);

        return $this->processCashbackPayment($cashback);
    }

    public function getCashbacksForRetry(): \Illuminate\Database\Eloquent\Collection
    {
        $maxAttempts = $this->retryConfig['max_attempts'] ?? 3;
        $delayMinutes = $this->retryConfig['delay_minutes'] ?? [0, 5, 30];

        return Cashback::where('status', 'failed')
            ->where('retry_count', '<', $maxAttempts)
            ->where(function ($query) use ($delayMinutes) {
                foreach ($delayMinutes as $attempt => $delay) {
                    if ($attempt === 0) continue;
                    
                    $query->orWhere(function ($q) use ($attempt, $delay) {
                        $q->where('retry_count', $attempt - 1)
                          ->where('last_retry_at', '<=', now()->subMinutes($delay));
                    });
                }
            })
            ->get();
    }

    public function getCashbackStatus(string $idempotencyKey): ?array
    {
        $cashback = Cashback::where('idempotency_key', $idempotencyKey)
            ->with(['user', 'purchase'])
            ->first();

        if (!$cashback) {
            return null;
        }

        return [
            'id' => $cashback->id,
            'status' => $cashback->status,
            'amount' => $cashback->amount,
            'currency' => $cashback->currency,
            'transaction_reference' => $cashback->transaction_reference,
            'retry_count' => $cashback->retry_count,
            'failure_reason' => $cashback->failure_reason,
            'created_at' => $cashback->created_at,
            'paid_at' => $cashback->paid_at,
            'purchase' => [
                'id' => $cashback->purchase->id,
                'amount' => $cashback->purchase->amount,
                'created_at' => $cashback->purchase->created_at
            ],
            'user' => [
                'id' => $cashback->user->id,
                'name' => $cashback->user->name,
                'email' => $cashback->user->email
            ]
        ];
    }

    private function handlePaymentFailure(Cashback $cashback, array $paymentResponse): void
    {
        $errorCode = $paymentResponse['error_code'] ?? 'UNKNOWN_ERROR';
        $isRetryable = $this->paymentService->isRetryableError($errorCode);

        $cashback->update([
            'status' => 'failed',
            'transaction_reference' => $paymentResponse['transaction_reference'] ?? null,
            'failure_reason' => $paymentResponse['message'] ?? 'Payment failed'
        ]);

        event(new CashbackFailed(
            $cashback->user, 
            $cashback, 
            $paymentResponse['message'] ?? 'Payment failed',
            $isRetryable && $cashback->retry_count < ($this->retryConfig['max_attempts'] ?? 3)
        ));

        Log::error('Cashback payment failed', [
            'cashback_id' => $cashback->id,
            'error_code' => $errorCode,
            'message' => $paymentResponse['message'] ?? 'Unknown error',
            'is_retryable' => $isRetryable,
            'retry_count' => $cashback->retry_count
        ]);

        if ($isRetryable) {
            $this->scheduleRetry($cashback);
        }
    }

    private function handlePaymentException(Cashback $cashback, \Exception $exception): void
    {
        $cashback->update([
            'status' => 'failed',
            'failure_reason' => $exception->getMessage()
        ]);

        event(new CashbackFailed(
            $cashback->user, 
            $cashback, 
            'System error occurred during payment processing',
            true
        ));

        Log::error('Cashback payment exception', [
            'cashback_id' => $cashback->id,
            'exception' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);

        $this->scheduleRetry($cashback);
    }

    private function scheduleRetry(Cashback $cashback): void
    {
        $delayMinutes = $this->retryConfig['delay_minutes'] ?? [0, 5, 30];
        $retryDelay = $delayMinutes[$cashback->retry_count] ?? 30;

        Log::info('Scheduling cashback retry', [
            'cashback_id' => $cashback->id,
            'retry_count' => $cashback->retry_count,
            'delay_minutes' => $retryDelay
        ]);
    }

    private function generateIdempotencyKey(int $userId, int $purchaseId): string
    {
        return 'cashback_' . $userId . '_' . $purchaseId . '_' . Str::random(8);
    }
}