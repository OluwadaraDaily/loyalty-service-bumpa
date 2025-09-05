<?php

use App\Http\Controllers\AdminAchievementController;
use App\Http\Controllers\UserAchievementController;
use Illuminate\Support\Facades\Route;

Route::prefix('users')->group(function () {
    Route::get('{user}/achievements', [UserAchievementController::class, 'index']);
});

Route::prefix('admin')->group(function () {
    Route::get('users/achievements', [AdminAchievementController::class, 'index']);
});