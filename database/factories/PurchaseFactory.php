<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PurchaseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'amount' => $this->faker->randomFloat(2, 10, 1000),
            'currency' => 'NGN',
            'payment_method' => $this->faker->randomElement(['card', 'bank_transfer', 'wallet']),
            'payment_reference' => $this->faker->uuid(),
            'status' => 'completed',
            'metadata' => [
                'product_name' => $this->faker->words(3, true),
            ],
        ];
    }

    public function completed(): static
    {
        return $this->state([
            'status' => 'completed',
        ]);
    }

    public function pending(): static
    {
        return $this->state([
            'status' => 'pending',
        ]);
    }

    public function failed(): static
    {
        return $this->state([
            'status' => 'failed',
        ]);
    }

    public function weekend(): static
    {
        return $this->state([
            'created_at' => now()->startOfWeek()->addDays(5), // Saturday
        ]);
    }
}