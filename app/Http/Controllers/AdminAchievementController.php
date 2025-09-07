<?php

namespace App\Http\Controllers;

use App\Models\User;

class AdminAchievementController extends Controller
{
    public function index()
    {
        $users = User::with(['achievements' => function ($query) {
            $query->withPivot('progress', 'unlocked', 'unlocked_at');
        }, 'badges'])->where('role', 'user')->get();

        $totalAchievementsUnlocked = $users->sum(function ($user) {
            return $user->achievements->where('pivot.unlocked', true)->count();
        });

        $totalBadgesEarned = $users->sum(function ($user) {
            return $user->badges->where('pivot.unlocked', true)->count();
        });

        return response()->json([
            'users' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'total_achievements' => $user->achievements->count(),
                    'unlocked_achievements' => $user->achievements->where('pivot.unlocked', true)->count(),
                    'current_badge' => $user->getCurrentBadge(),
                    'created_at' => $user->created_at->toDateString(),
                ];
            }),
            'total_users' => $users->count(),
            'total_achievements_unlocked' => $totalAchievementsUnlocked,
            'total_badges_earned' => $totalBadgesEarned,
        ]);
    }

}
