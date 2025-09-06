# Cashback Payment System Implementation

## Overview

This document describes the implementation of an achievement-based cashback payment system that automatically processes cashbacks when users unlock achievements or badges during purchases. The system includes robust error handling, retry mechanisms, and idempotent transaction processing.

## Architecture

### Core Components

1. **CashbackCalculationService** - Calculates cashback amounts based on unlocked achievements and badges
2. **CashbackService** - Handles cashback transaction processing with idempotency and retries
3. **MockPaymentService** - Simulates payment provider API (Paystack/Flutterwave-like) with configurable success/failure rates
4. **LoyaltyService** - Orchestrates the entire flow: purchase → achievements → cashback

### Database Schema

Enhanced `cashbacks` table with transaction fields:

```sql
- idempotency_key (unique) - Prevents duplicate processing
- transaction_reference - Payment provider transaction ID
- payment_provider - Provider used (mock, paystack, flutterwave)
- retry_count - Number of retry attempts
- last_retry_at - Timestamp of last retry
- failure_reason - Error message for failed payments
- status - initiated|processing|completed|failed|cancelled
```

## Flow Diagram

```bash
Purchase Event → Achievement/Badge Unlock → Cashback Calculation → Payment Processing
                                                    ↓
Event Notifications ← Payment Success/Failure ← Mock Payment Service
                                                    ↓
                            Retry Logic (if failed) ← Queue Job
```

## Key Features

### 1. Request-Cycle Achievement Tracking

Instead of time-based lookups, the system tracks achievements unlocked during the current request:

```php
// LoyaltyService tracks newly unlocked items
private array $newlyUnlockedAchievements = [];
private array $newlyUnlockedBadges = [];

// Passed to cashback calculation
$this->newlyUnlockedAchievements[] = $achievement;
```

### 2. Cashback Calculation Rules

**Achievement Rates:**

- First Purchase: 2% of purchase amount
- Big Spender: 5% of purchase amount  
- Loyal Customer: 3% of purchase amount
- Weekend Warrior: 4% of purchase amount

**Badge Multipliers:**

- Bronze Badge: 1.0x (no bonus)
- Silver Badge: 1.2x (20% bonus)
- Gold Badge: 1.5x (50% bonus)
- Platinum Badge: 2.0x (100% bonus)

**Limits:**

- Minimum cashback: 500 NGN
- Maximum cashback: 10,000 NGN

### 3. Idempotent Processing

```php
// Unique key prevents duplicate cashbacks
$idempotencyKey = 'cashback_' . $userId . '_' . $purchaseId . '_' . Str::random(8);

// Database constraint ensures uniqueness
$existingCashback = Cashback::where('idempotency_key', $idempotencyKey)->first();
```

### 4. Mock Payment Service

Configurable failure scenarios for testing:

```php
// config/payment.php
'mock' => [
    'success_rate' => 0.8,                    // 80% success rate
    'network_timeout_rate' => 0.1,           // 10% timeout errors
    'insufficient_funds_rate' => 0.05,       // 5% insufficient funds
    'processing_delay_ms' => [100, 500],     // Random delay simulation
]
```

### 5. Retry Mechanism

**Strategy:**

- Maximum 3 retry attempts
- Delays: immediate, 5 minutes, 30 minutes
- Only retries on retryable errors (network timeouts, service unavailable)
- Non-retryable: insufficient funds, invalid parameters

**Implementation:**

```php
// Automatic retry command
php artisan cashback:process-retries

// Manual retry
$cashbackService->retryCashbackPayment($cashback);
```

## Event System

**Events dispatched:**

- `CashbackInitiated` - When cashback processing begins
- `CashbackCompleted` - When payment succeeds
- `CashbackFailed` - When payment fails (with retry info)

**Broadcasting channels:**

- `user.{userId}` - User-specific notifications
- `cashbacks` - Global cashback events

## Configuration

### Environment Variables

```env
# Payment Mock Configuration
PAYMENT_MOCK_SUCCESS_RATE=0.8
PAYMENT_MOCK_TIMEOUT_RATE=0.1
PAYMENT_MOCK_INSUFFICIENT_FUNDS_RATE=0.05
PAYMENT_MOCK_MIN_DELAY=100
PAYMENT_MOCK_MAX_DELAY=500

# Cashback Configuration
CASHBACK_MAX_AMOUNT=10000
CASHBACK_MIN_AMOUNT=500
CASHBACK_MAX_RETRY_ATTEMPTS=3
```

## Usage Examples

### Processing a Purchase with Cashback

```php
$loyaltyService = app(LoyaltyService::class);

$loyaltyService->processPurchaseEvent([
    'user_id' => $userId,
    'amount' => 15000.00,
    'currency' => 'NGN',
    'payment_method' => 'card',
    'payment_reference' => 'TXN_123456',
    'status' => 'completed'
]);
```

### Manual Cashback Calculation

```php
$calculationService = app(CashbackCalculationService::class);

$result = $calculationService->calculateCashbackForPurchase(
    $user, 
    $purchase, 
    $newlyUnlockedAchievements,
    $newlyUnlockedBadges
);

// Returns:
// [
//     'eligible' => true,
//     'amount' => 1050.00,
//     'currency' => 'NGN',
//     'base_amount' => 1050.00,
//     'multiplier' => 1.0,
//     'triggered_by' => [
//         'achievements' => ['First Purchase', 'Big Spender'],
//         'badges' => []
//     ]
// ]
```

## Testing Results

### Test Scenario 1: Successful Cashback

- **User:** Alice Johnson (fresh user)
- **Purchase:** 15,000 NGN
- **Achievements Unlocked:** First Purchase, Big Spender
- **Cashback Calculated:** (15000 × 0.02) + (15000 × 0.05) = 1,050 NGN
- **Result:** ✅ Payment completed successfully

### Test Scenario 2: Payment Failure & Retry

- **User:** Bob Wilson
- **Purchase:** 12,000 NGN
- **Initial Result:** Payment failed (service unavailable)
- **Retry Result:** ✅ Successful on retry
- **Final Status:** Completed with transaction reference

### Test Scenario 3: Multiple Retries

- **User:** Charlie Brown
- **Purchase:** 8,000 NGN
- **Failure 1:** Service unavailable
- **Failure 2:** Insufficient funds
- **Retry 3:** ✅ Success (560 NGN cashback)

## API Integration Points

### Real Payment Providers

To integrate with actual payment providers, implement the payment interface:

```php
interface PaymentServiceInterface
{
    public function initializeTransfer(array $transferData): array;
    public function verifyTransaction(string $reference): array;
    public function isRetryableError(string $errorCode): bool;
}
```

## Monitoring & Logging

**Key log events:**

- Cashback eligibility decisions
- Payment processing attempts
- Retry scheduling and execution
- Final success/failure outcomes

## Security Considerations

1. **Idempotency keys** prevent duplicate payments
2. **Database transactions** ensure data consistency
3. **Retry limits** prevent infinite loops
4. **Amount validation** prevents negative/excessive cashbacks
5. **User authorization** ensures users can only access their own cashbacks

## Commands

```bash
# Process failed cashbacks for retry
php artisan cashback:process-retries

# Run database migrations
php artisan migrate

# Start development server with queue processing
composer dev
```

This implementation provides a robust, production-ready cashback system with comprehensive error handling, retry logic, and monitoring capabilities.
