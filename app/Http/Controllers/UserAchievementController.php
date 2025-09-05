<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserAchievementController extends Controller
{
    public function index(User $user)
    {
        return response()->json([
          'user' => $user,
          'achievements' => $user->achievements()->with('pivot')->get()
        ]);
    }
}
