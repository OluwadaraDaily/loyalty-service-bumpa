<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class BadgeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->words(2, true),
            'description' => $this->faker->sentence(),
            'type' => $this->faker->randomElement(['bronze', 'silver', 'gold']),
            'icon_url' => 'https://example.com/badge.png',
            'multiplier' => $this->faker->randomFloat(2, 1.0, 2.0),
            'points_required' => $this->faker->numberBetween(50, 500),
        ];
    }

    public function bronze(): static
    {
        return $this->state([
            'type' => 'bronze',
            'multiplier' => 1.1,
        ]);
    }

    public function silver(): static
    {
        return $this->state([
            'type' => 'silver',
            'multiplier' => 1.25,
        ]);
    }

    public function gold(): static
    {
        return $this->state([
            'type' => 'gold',
            'multiplier' => 1.5,
        ]);
    }
}