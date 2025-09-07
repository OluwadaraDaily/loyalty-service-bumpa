<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Set testing environment configurations
        config(['payment.cashback.retry.max_attempts' => 3]);
        config(['payment.cashback.retry.delay_minutes' => [0, 1, 5]]);
    }

    /**
     * Assert that a model exists in database with given attributes.
     */
    protected function assertModelExistsInDatabase(string $model, array $attributes): void
    {
        $this->assertDatabaseHas(app($model)->getTable(), $attributes);
    }

    /**
     * Create authenticated user for API tests.
     */
    protected function createAuthenticatedUser(array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        Sanctum::actingAs($user);
        return $user;
    }

    /**
     * Create test purchase data.
     */
    protected function createPurchaseData(int $userId, array $overrides = []): array
    {
        return array_merge([
            'user_id' => $userId,
            'amount' => 100.00,
            'currency' => 'NGN',
            'payment_method' => 'card',
            'payment_reference' => 'test_' . uniqid(),
            'status' => 'completed',
            'timestamp' => now()->toISOString(),
            'metadata' => []
        ], $overrides);
    }
}
