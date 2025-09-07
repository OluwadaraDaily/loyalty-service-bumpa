<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\Badge;
use App\Models\Purchase;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\UserBadge;
use Illuminate\Support\Facades\Log;

class CashbackCalculationService
{
    private array $achievementRates;

    private array $badgeMultipliers;

    private float $maxCashbackAmount;

    private float $minCashbackAmount;

    public function __construct()
    {
        $this->achievementRates = config('payment.cashback.achievement_rates', []);
        $this->badgeMultipliers = config('payment.cashback.badge_multipliers', []);
        $this->maxCashbackAmount = config('payment.cashback.max_cashback_amount', 10000);
        $this->minCashbackAmount = config('payment.cashback.min_cashback_amount', 10);
    }

    public function calculateCashbackForPurchase(User $user, Purchase $purchase, array $newlyUnlockedAchievements = [], array $newlyUnlockedBadges = []): array
    {
        // Calculate base cashback (always eligible)
        $baseCashbackRate = config('payment.cashback.base_rate', 0.01); // 1% default base rate
        $baseCashbackAmount = $purchase->amount * $baseCashbackRate;

        // Add bonus cashback for newly unlocked achievements
        $bonusCashbackAmount = 0;
        if (! empty($newlyUnlockedAchievements)) {
            $bonusCashbackAmount += $this->calculateBonusCashback($purchase, $newlyUnlockedAchievements);
        }

        $totalCashbackAmount = $baseCashbackAmount + $bonusCashbackAmount;

        // Apply badge multiplier if user has unlocked badges
        $multiplier = $this->calculateBadgeMultiplierForUser($user, $newlyUnlockedBadges);
        $finalAmount = $totalCashbackAmount * $multiplier;
        $finalAmount = $this->applyCashbackLimits($finalAmount);

        Log::info('Cashback calculation completed', [
            'user_id' => $user->id,
            'purchase_id' => $purchase->id,
            'purchase_amount' => $purchase->amount,
            'base_cashback' => $baseCashbackAmount,
            'bonus_cashback' => $bonusCashbackAmount,
            'multiplier' => $multiplier,
            'final_amount' => $finalAmount,
            'newly_unlocked_achievements' => collect($newlyUnlockedAchievements)->pluck('name')->toArray(),
            'newly_unlocked_badges' => collect($newlyUnlockedBadges)->pluck('name')->toArray(),
        ]);

        $eligible = $finalAmount >= $this->minCashbackAmount;

        return [
            'eligible' => $eligible,
            'amount' => $finalAmount,
            'currency' => $purchase->currency,
            'base_amount' => $baseCashbackAmount,
            'bonus_amount' => $bonusCashbackAmount,
            'multiplier' => $multiplier,
            'triggered_by' => [
                'achievements' => collect($newlyUnlockedAchievements)->pluck('name')->toArray(),
                'badges' => collect($newlyUnlockedBadges)->pluck('name')->toArray(),
            ],
        ];
    }

    public function getEligibleCashbackScenarios(User $user): array
    {
        $scenarios = [];

        foreach ($this->achievementRates as $achievementName => $rate) {
            $achievement = Achievement::where('name', $achievementName)->first();
            if (! $achievement) {
                continue;
            }

            $userAchievement = UserAchievement::where([
                'user_id' => $user->id,
                'achievement_id' => $achievement->id,
            ])->first();

            $scenarios[] = [
                'type' => 'achievement',
                'name' => $achievementName,
                'rate' => $rate,
                'unlocked' => $userAchievement?->unlocked ?? false,
                'progress' => $userAchievement?->progress ?? 0,
                'required' => $achievement->points_required,
                'description' => $achievement->description,
            ];
        }

        foreach ($this->badgeMultipliers as $badgeName => $multiplier) {
            $badge = Badge::where('name', $badgeName)->first();
            if (! $badge) {
                continue;
            }

            $userBadge = UserBadge::where([
                'user_id' => $user->id,
                'badge_id' => $badge->id,
            ])->first();

            $scenarios[] = [
                'type' => 'badge_multiplier',
                'name' => $badgeName,
                'multiplier' => $multiplier,
                'unlocked' => $userBadge?->unlocked ?? false,
                'description' => $badge->description,
            ];
        }

        return $scenarios;
    }

    private function getRecentlyUnlockedAchievements(User $user): array
    {
        return UserAchievement::with('achievement')
            ->where('user_id', $user->id)
            ->where('unlocked', true)
            ->where('unlocked_at', '>=', now()->subMinutes(10))
            ->get()
            ->pluck('achievement')
            ->filter()
            ->toArray();
    }

    private function getRecentlyUnlockedBadges(User $user): array
    {
        return UserBadge::with('badge')
            ->where('user_id', $user->id)
            ->where('unlocked', true)
            ->where('unlocked_at', '>=', now()->subMinutes(5))
            ->get()
            ->pluck('badge')
            ->filter()
            ->toArray();
    }

    private function calculateBonusCashback(Purchase $purchase, array $unlockedAchievements): float
    {
        $totalRate = 0;

        foreach ($unlockedAchievements as $achievement) {
            $achievementName = is_array($achievement) ? $achievement['name'] : $achievement->name;
            $rate = $this->achievementRates[$achievementName] ?? 0;
            $totalRate += $rate;

            Log::debug('Applied achievement bonus cashback rate', [
                'achievement' => $achievementName,
                'rate' => $rate,
                'total_rate' => $totalRate,
            ]);
        }

        return $purchase->amount * $totalRate;
    }

    private function calculateBadgeMultiplierForUser(User $user, array $newlyUnlockedBadges = []): float
    {
        $maxMultiplier = 1.0;

        // Check newly unlocked badges first (higher priority)
        foreach ($newlyUnlockedBadges as $badge) {
            $badgeName = is_array($badge) ? $badge['name'] : $badge->name;
            $multiplier = $this->badgeMultipliers[$badgeName] ?? 1.0;
            $maxMultiplier = max($maxMultiplier, $multiplier);

            Log::debug('Applied newly unlocked badge multiplier', [
                'badge' => $badgeName,
                'multiplier' => $multiplier,
                'max_multiplier' => $maxMultiplier,
            ]);
        }

        // If no newly unlocked badges, check user's existing highest badge
        if (empty($newlyUnlockedBadges)) {
            $userBadges = $user->badges()->where('user_badges.unlocked', true)->get();
            foreach ($userBadges as $badge) {
                $multiplier = $this->badgeMultipliers[$badge->name] ?? 1.0;
                $maxMultiplier = max($maxMultiplier, $multiplier);
            }
        }

        return $maxMultiplier;
    }

    private function calculateBaseCashback(Purchase $purchase, array $unlockedAchievements): float
    {
        $totalRate = 0;

        foreach ($unlockedAchievements as $achievement) {
            $rate = $this->achievementRates[$achievement['name']] ?? 0;
            $totalRate += $rate;

            Log::debug('Applied achievement cashback rate', [
                'achievement' => $achievement['name'],
                'rate' => $rate,
                'total_rate' => $totalRate,
            ]);
        }

        return $purchase->amount * $totalRate;
    }

    private function calculateBadgeMultiplier(array $unlockedBadges): float
    {
        $maxMultiplier = 1.0;

        foreach ($unlockedBadges as $badge) {
            $multiplier = $this->badgeMultipliers[$badge['name']] ?? 1.0;
            $maxMultiplier = max($maxMultiplier, $multiplier);

            Log::debug('Applied badge multiplier', [
                'badge' => $badge['name'],
                'multiplier' => $multiplier,
                'max_multiplier' => $maxMultiplier,
            ]);
        }

        return $maxMultiplier;
    }

    private function applyCashbackLimits(float $amount): float
    {
        $originalAmount = $amount;

        if ($amount > $this->maxCashbackAmount) {
            $amount = $this->maxCashbackAmount;
            Log::info('Cashback amount capped at maximum', [
                'original' => $originalAmount,
                'capped' => $amount,
                'max_limit' => $this->maxCashbackAmount,
            ]);
        }

        if ($amount < $this->minCashbackAmount) {
            $amount = 0;
            Log::info('Cashback amount below minimum threshold', [
                'calculated' => $originalAmount,
                'min_threshold' => $this->minCashbackAmount,
                'final' => $amount,
            ]);
        }

        return round($amount, 2);
    }

    public function getCashbackLimits(): array
    {
        return [
            'min_amount' => $this->minCashbackAmount,
            'max_amount' => $this->maxCashbackAmount,
        ];
    }

    public function getConfiguredRates(): array
    {
        return [
            'achievement_rates' => $this->achievementRates,
            'badge_multipliers' => $this->badgeMultipliers,
        ];
    }
}
