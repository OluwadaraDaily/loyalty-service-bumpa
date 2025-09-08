<?php

namespace Database\Seeders;

use App\Models\Achievement;
use App\Models\Badge;
use Illuminate\Database\Seeder;

class LoyaltySystemSeeder extends Seeder
{
    public function run(): void
    {
        // Create Achievements using updateOrCreate to avoid duplicates
        $firstPurchase = Achievement::updateOrCreate(
            ['name' => 'First Purchase'],
            [
                'description' => 'Make your first purchase',
                'points_required' => 1,
            ]
        );

        $loyalCustomer = Achievement::updateOrCreate(
            ['name' => 'Loyal Customer'],
            [
                'description' => 'Make 5 purchases',
                'points_required' => 5,
            ]
        );

        $bigSpender = Achievement::updateOrCreate(
            ['name' => 'Big Spender'],
            [
                'description' => 'Spend $100 or more in total',
                'points_required' => 100,
            ]
        );

        $weekendWarrior = Achievement::updateOrCreate(
            ['name' => 'Weekend Warrior'],
            [
                'description' => 'Make 3 purchases on weekends',
                'points_required' => 3,
            ]
        );

        $shopaholic = Achievement::updateOrCreate(
            ['name' => 'Shopaholic'],
            [
                'description' => 'Make 10 purchases',
                'points_required' => 10,
            ]
        );

        // Create Badges using updateOrCreate to avoid duplicates
        $newbie = Badge::updateOrCreate(
            ['name' => 'Shopping Newbie'],
            [
                'description' => 'Welcome to our store! You\'ve made your first purchase.',
                'icon_url' => '/icons/newbie-badge.svg',
                'type' => 'purchase_count',
                'points_required' => 1,
            ]
        );

        $regular = Badge::updateOrCreate(
            ['name' => 'Regular Shopper'],
            [
                'description' => 'You\'re becoming a regular! Keep it up.',
                'icon_url' => '/icons/regular-badge.svg',
                'type' => 'purchase_count',
                'points_required' => 5,
            ]
        );

        $vip = Badge::updateOrCreate(
            ['name' => 'VIP Customer'],
            [
                'description' => 'You\'re a VIP! Thanks for your loyalty and spending.',
                'icon_url' => '/icons/vip-badge.svg',
                'type' => 'total_spent',
                'points_required' => 100,
            ]
        );

        $champion = Badge::updateOrCreate(
            ['name' => 'Shopping Champion'],
            [
                'description' => 'You\'ve achieved shopping mastery! Ultimate loyalty status.',
                'icon_url' => '/icons/champion-badge.svg',
                'type' => 'purchase_count',
                'points_required' => 10,
            ]
        );

        // Create Badge-Achievement relationships (sync to avoid duplicates)
        // Newbie Badge: Just needs first purchase
        $newbie->achievements()->sync([$firstPurchase->id]);

        // Regular Badge: Needs first purchase + loyal customer
        $regular->achievements()->sync([
            $firstPurchase->id,
            $loyalCustomer->id,
        ]);

        // VIP Badge: Needs loyal customer + big spender
        $vip->achievements()->sync([
            $loyalCustomer->id,
            $bigSpender->id,
        ]);

        // Champion Badge: Needs all achievements
        $champion->achievements()->sync([
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
