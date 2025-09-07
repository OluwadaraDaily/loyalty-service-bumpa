<?php

namespace Database\Factories;

use App\Models\Purchase;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CashbackFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'purchase_id' => Purchase::factory(),
            'amount' => $this->faker->randomFloat(2, 10, 500),
            'currency' => 'NGN',
            'status' => $this->faker->randomElement(['initiated', 'processing', 'completed', 'failed']),
            'idempotency_key' => 'test_' . $this->faker->uuid(),
            'payment_provider' => 'mock_provider',
            'retry_count' => 0,
        ];
    }

    public function initiated(): static
    {
        return $this->state([
            'status' => 'initiated',
        ]);
    }

    public function processing(): static
    {
        return $this->state([
            'status' => 'processing',
        ]);
    }

    public function completed(): static
    {
        return $this->state([
            'status' => 'completed',
            'transaction_reference' => 'txn_' . $this->faker->uuid(),
            'paid_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state([
            'status' => 'failed',
            'failure_reason' => $this->faker->sentence(),
        ]);
    }

    public function withRetries(int $count = 1): static
    {
        return $this->state([
            'retry_count' => $count,
            'last_retry_at' => now()->subMinutes(5),
        ]);
    }
}