<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserAchievementController extends Controller
{
    public function index(User $user)
    {
        $achievements = $user->achievements()
            ->with(['badges', 'pivot'])
            ->get()
            ->map(function ($achievement) {
                return [
                    'id' => $achievement->id,
                    'title' => $achievement->title,
                    'description' => $achievement->description,
                    'type' => $achievement->type,
                    'threshold' => $achievement->threshold,
                    'progress' => $achievement->pivot->progress,
                    'unlocked' => $achievement->pivot->unlocked,
                    'unlocked_at' => $achievement->pivot->unlocked_at,
                    'badges' => $achievement->badges->map(function ($badge) {
                        return [
                            'id' => $badge->id,
                            'name' => $badge->name,
                            'description' => $badge->description,
                            'icon_url' => $badge->icon_url,
                        ];
                    }),
                ];
            });

        $badges = $user->badges()
            ->wherePivot('unlocked', true)
            ->get()
            ->map(function ($badge) {
                return [
                    'id' => $badge->id,
                    'name' => $badge->name,
                    'description' => $badge->description,
                    'icon_url' => $badge->icon_url,
                    'unlocked_at' => $badge->pivot->unlocked_at,
                ];
            });

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'current_badge' => $user->getCurrentBadge(),
            ],
            'achievements' => $achievements,
            'badges' => $badges,
        ]);
    }

    public function dashboardStats(User $user)
    {
        $totalPurchases = $user->purchases()->count();
        $totalSpent = $user->purchases()->sum('amount');
        $totalCashback = $user->cashbacks()->where('status', 'completed')->sum('amount');
        $pendingCashback = $user->cashbacks()->where('status', 'pending')->sum('amount');

        $recentPurchases = $user->purchases()
            ->latest()
            ->take(5)
            ->get(['id', 'amount', 'created_at']);

        $recentCashbacks = $user->cashbacks()
            ->where('status', 'completed')
            ->latest()
            ->take(5)
            ->get(['id', 'amount', 'status', 'created_at']);

        return response()->json([
            'statistics' => [
                'total_purchases' => $totalPurchases,
                'total_spent' => number_format($totalSpent, 2),
                'total_cashback' => number_format($totalCashback, 2),
                'pending_cashback' => number_format($pendingCashback, 2),
            ],
            'recent_activity' => [
                'purchases' => $recentPurchases,
                'cashbacks' => $recentCashbacks,
            ],
        ]);
    }

    public function simulateAchievement(User $user)
    {
        $achievement = $user->achievements()
            ->wherePivot('unlocked', false)
            ->first();

        if (!$achievement) {
            return response()->json([
                'success' => false,
                'message' => 'No achievements available to unlock'
            ]);
        }

        $user->achievements()->updateExistingPivot($achievement->id, [
            'progress' => $achievement->threshold,
            'unlocked' => true,
            'unlocked_at' => now(),
        ]);

        $badges = $achievement->badges;
        $unlockedBadges = [];

        foreach ($badges as $badge) {
            $userBadge = $user->badges()->wherePivot('badge_id', $badge->id)->first();
            if (!$userBadge || !$userBadge->pivot->unlocked) {
                $user->badges()->syncWithoutDetaching([
                    $badge->id => [
                        'unlocked' => true,
                        'unlocked_at' => now(),
                    ]
                ]);
                $unlockedBadges[] = [
                    'id' => $badge->id,
                    'name' => $badge->name,
                    'description' => $badge->description,
                    'icon_url' => $badge->icon_url,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'achievement' => [
                'id' => $achievement->id,
                'title' => $achievement->title,
                'description' => $achievement->description,
            ],
            'badges' => $unlockedBadges,
        ]);
    }
}
