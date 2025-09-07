<?php

namespace Database\Seeders;

use App\Models\Achievement;
use App\Models\Badge;
use Illuminate\Database\Seeder;

class LoyaltySystemSeeder extends Seeder
{
    public function run(): void
    {
        // Create Achievements
        $firstPurchase = Achievement::create([
            'name' => 'First Purchase',
            'description' => 'Make your first purchase',
            'points_required' => 1,
        ]);

        $loyalCustomer = Achievement::create([
            'name' => 'Loyal Customer',
            'description' => 'Make 5 purchases',
            'points_required' => 5,
        ]);

        $bigSpender = Achievement::create([
            'name' => 'Big Spender',
            'description' => 'Spend $100 or more in total',
            'points_required' => 100,
        ]);

        $weekendWarrior = Achievement::create([
            'name' => 'Weekend Warrior',
            'description' => 'Make 3 purchases on weekends',
            'points_required' => 3,
        ]);

        $shopaholic = Achievement::create([
            'name' => 'Shopaholic',
            'description' => 'Make 10 purchases',
            'points_required' => 10,
        ]);

        // Create Badges
        $newbie = Badge::create([
            'name' => 'Shopping Newbie',
            'description' => 'Welcome to our store! You\'ve made your first purchase.',
            'icon_url' => '/icons/newbie-badge.svg',
            'type' => 'purchase_count',
            'points_required' => 1,
        ]);

        $regular = Badge::create([
            'name' => 'Regular Shopper',
            'description' => 'You\'re becoming a regular! Keep it up.',
            'icon_url' => '/icons/regular-badge.svg',
            'type' => 'purchase_count',
            'points_required' => 5,
        ]);

        $vip = Badge::create([
            'name' => 'VIP Customer',
            'description' => 'You\'re a VIP! Thanks for your loyalty and spending.',
            'icon_url' => '/icons/vip-badge.svg',
            'type' => 'total_spent',
            'points_required' => 100,
        ]);

        $champion = Badge::create([
            'name' => 'Shopping Champion',
            'description' => 'You\'ve achieved shopping mastery! Ultimate loyalty status.',
            'icon_url' => '/icons/champion-badge.svg',
            'type' => 'purchase_count',
            'points_required' => 10,
        ]);

        // Create Badge-Achievement relationships
        // Newbie Badge: Just needs first purchase
        $newbie->achievements()->attach($firstPurchase->id);

        // Regular Badge: Needs first purchase + loyal customer
        $regular->achievements()->attach([
            $firstPurchase->id,
            $loyalCustomer->id,
        ]);

        // VIP Badge: Needs loyal customer + big spender
        $vip->achievements()->attach([
            $loyalCustomer->id,
            $bigSpender->id,
        ]);

        // Champion Badge: Needs all achievements
        $champion->achievements()->attach([
            $loyalCustomer->id,
            $bigSpender->id,
            $weekendWarrior->id,
            $shopaholic->id,
        ]);

        $this->command->info('Loyalty system seeded successfully!');
        $this->command->info('Created '.Achievement::count().' achievements');
        $this->command->info('Created '.Badge::count().' badges');
    }
}
