<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class AchievementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->words(2, true),
            'description' => $this->faker->sentence(),
            'points_required' => $this->faker->numberBetween(1, 100),
        ];
    }

    public function firstPurchase(): static
    {
        return $this->state([
            'name' => 'First Purchase',
            'description' => 'Complete your first purchase',
            'points_required' => 1,
        ]);
    }

    public function bigSpender(): static
    {
        return $this->state([
            'name' => 'Big Spender',
            'description' => 'Spend 1000 NGN or more',
            'points_required' => 1000,
        ]);
    }

    public function loyalCustomer(): static
    {
        return $this->state([
            'name' => 'Loyal Customer',
            'description' => 'Make 10 purchases',
            'points_required' => 10,
        ]);
    }

    public function weekendWarrior(): static
    {
        return $this->state([
            'name' => 'Weekend Warrior',
            'description' => 'Make 3 weekend purchases',
            'points_required' => 3,
        ]);
    }
}