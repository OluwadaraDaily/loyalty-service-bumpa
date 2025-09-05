<?php

namespace App\Http\Controllers;

use App\Models\User;

class AdminAchievementController extends Controller
{
    public function index()
    {
        $users = User::with(['achievements' => function ($query) {
            $query->withPivot('progress', 'unlocked', 'unlocked_at');
        }])->get();

        return response()->json([
            'users' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'total_achievements' => $user->achievements->count(),
                    'unlocked_achievements' => $user->achievements->where('pivot.unlocked', true)->count(),
                    'current_badge' => $user->getCurrentBadge(),
                    'achievements' => $user->achievements->map(function ($achievement) {
                        return [
                            'id' => $achievement->id,
                            'name' => $achievement->name,
                            'description' => $achievement->description,
                            'points_required' => $achievement->points_required,
                            'progress' => $achievement->pivot->progress,
                            'unlocked' => $achievement->pivot->unlocked,
                            'unlocked_at' => $achievement->pivot->unlocked_at,
                        ];
                    })
                ];
            })
        ]);
    }

}
