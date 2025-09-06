<?php

namespace App\Services;

use App\Events\AchievementUnlocked;
use App\Events\BadgeUnlocked;
use App\Models\Achievement;
use App\Models\Badge;
use App\Models\Purchase;
use App\Models\User;
use App\Models\UserAchievement;
use App\Models\UserBadge;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LoyaltyService
{
    public function processPurchaseEvent(array $purchaseData): void
    {
        try {
            DB::beginTransaction();

            $user = User::find($purchaseData['user_id']);
            if (!$user) {
                Log::warning('User not found for purchase event', ['user_id' => $purchaseData['user_id']]);
                return;
            }

            $purchase = $this->createPurchaseRecord($purchaseData);
            
            $this->checkAndUnlockAchievements($user, $purchase);
            $this->checkAndUnlockBadges($user);

            DB::commit();
            
            Log::info('Successfully processed purchase event', [
                'user_id' => $user->id,
                'purchase_id' => $purchase->id,
                'amount' => $purchase->amount
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Failed to process purchase event', [
                'error' => $e->getMessage(),
                'data' => $purchaseData
            ]);
            throw $e;
        }
    }

    private function createPurchaseRecord(array $purchaseData): Purchase
    {
        return Purchase::create([
            'user_id' => $purchaseData['user_id'],
            'amount' => $purchaseData['amount'],
            'currency' => $purchaseData['currency'] ?? 'NGN',
            'payment_method' => $purchaseData['payment_method'] ?? 'unknown',
            'payment_reference' => $purchaseData['payment_reference'] ?? null,
            'status' => $purchaseData['status'] ?? 'completed',
            'metadata' => $purchaseData['metadata'] ?? []
        ]);
    }

    private function checkAndUnlockAchievements(User $user, Purchase $purchase): void
    {
        $achievements = Achievement::all();

        foreach ($achievements as $achievement) {
            $userAchievement = UserAchievement::firstOrCreate([
                'user_id' => $user->id,
                'achievement_id' => $achievement->id
            ], [
                'progress' => 0,
                'unlocked' => false
            ]);

            if ($userAchievement->unlocked) {
                continue;
            }

            $newProgress = $this->calculateAchievementProgress($user, $achievement, $purchase);
            
            if ($newProgress >= $achievement->points_required) {
                $userAchievement->update([
                    'progress' => $achievement->points_required,
                    'unlocked' => true,
                    'unlocked_at' => now()
                ]);

                event(new AchievementUnlocked($user, $achievement));
                
                Log::info('Achievement unlocked', [
                    'user_id' => $user->id,
                    'achievement_id' => $achievement->id,
                    'achievement_name' => $achievement->name
                ]);
            } else {
                $userAchievement->update(['progress' => $newProgress]);
                
                Log::debug('Achievement progress updated', [
                    'user_id' => $user->id,
                    'achievement_id' => $achievement->id,
                    'progress' => $newProgress,
                    'required' => $achievement->points_required
                ]);
            }
        }
    }

    private function checkAndUnlockBadges(User $user): void
    {
        $badges = Badge::with('achievements')->get();

        foreach ($badges as $badge) {
            $userBadge = UserBadge::firstOrCreate([
                'user_id' => $user->id,
                'badge_id' => $badge->id
            ], [
                'unlocked' => false
            ]);

            if ($userBadge->unlocked) {
                continue;
            }

            $progress = $this->calculateBadgeProgress($user, $badge);
            
            if ($progress >= 100) {
                $userBadge->update([
                    'unlocked' => true,
                    'unlocked_at' => now()
                ]);

                event(new BadgeUnlocked($user, $badge));
                
                Log::info('Badge unlocked', [
                    'user_id' => $user->id,
                    'badge_id' => $badge->id,
                    'badge_name' => $badge->name
                ]);
            } else {
                Log::debug('Badge progress calculated', [
                    'user_id' => $user->id,
                    'badge_id' => $badge->id,
                    'progress' => $progress . '%'
                ]);
            }
        }
    }

    private function calculateAchievementProgress(User $user, Achievement $achievement, Purchase $purchase): int
    {
        switch ($achievement->name) {
            case 'First Purchase':
                return $user->purchases()->count();
            
            case 'Big Spender':
                return (int) $user->purchases()->sum('amount');
            
            case 'Loyal Customer':
                return $user->purchases()->count();
            
            case 'Weekend Warrior':
                $weekendPurchases = $user->purchases()
                    ->whereRaw('DAYOFWEEK(created_at) IN (1, 7)')
                    ->count();
                return $weekendPurchases;
            
            default:
                return $user->purchases()->count();
        }
    }

    private function calculateBadgeProgress(User $user, Badge $badge): float
    {
        $requiredAchievements = $badge->achievements;
        
        if ($requiredAchievements->isEmpty()) {
            return 0;
        }

        $unlockedCount = 0;
        foreach ($requiredAchievements as $achievement) {
            $userAchievement = UserAchievement::where([
                'user_id' => $user->id,
                'achievement_id' => $achievement->id,
                'unlocked' => true
            ])->first();

            if ($userAchievement) {
                $unlockedCount++;
            }
        }

        return ($unlockedCount / $requiredAchievements->count()) * 100;
    }

    public function getUserAchievementProgress(User $user): array
    {
        $achievements = Achievement::with(['userAchievements' => function ($query) use ($user) {
            $query->where('user_id', $user->id);
        }])->get();

        return $achievements->map(function ($achievement) use ($user) {
            $userAchievement = $achievement->userAchievements->first();
            
            return [
                'id' => $achievement->id,
                'name' => $achievement->name,
                'description' => $achievement->description,
                'points_required' => $achievement->points_required,
                'progress' => $userAchievement ? $userAchievement->progress : 0,
                'unlocked' => $userAchievement ? $userAchievement->unlocked : false,
                'unlocked_at' => $userAchievement ? $userAchievement->unlocked_at : null,
                'progress_percentage' => $achievement->points_required > 0 
                    ? round((($userAchievement ? $userAchievement->progress : 0) / $achievement->points_required) * 100, 2)
                    : 0
            ];
        })->toArray();
    }

    public function getUserBadgeProgress(User $user): array
    {
        $badges = Badge::with(['achievements', 'userBadges' => function ($query) use ($user) {
            $query->where('user_id', $user->id);
        }])->get();

        return $badges->map(function ($badge) use ($user) {
            $userBadge = $badge->userBadges->first();
            $progress = $this->calculateBadgeProgress($user, $badge);
            
            return [
                'id' => $badge->id,
                'name' => $badge->name,
                'description' => $badge->description,
                'icon_url' => $badge->icon_url,
                'unlocked' => $userBadge ? $userBadge->unlocked : false,
                'unlocked_at' => $userBadge ? $userBadge->unlocked_at : null,
                'progress_percentage' => $progress,
                'required_achievements' => $badge->achievements->count(),
                'completed_achievements' => $badge->achievements->filter(function ($achievement) use ($user) {
                    return UserAchievement::where([
                        'user_id' => $user->id,
                        'achievement_id' => $achievement->id,
                        'unlocked' => true
                    ])->exists();
                })->count()
            ];
        })->toArray();
    }
}