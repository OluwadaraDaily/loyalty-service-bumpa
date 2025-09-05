<?php

use App\Http\Controllers\AdminAchievementController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserAchievementController;
use Illuminate\Support\Facades\Route;

// Public authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // General authenticated routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // User-specific routes
    Route::middleware('role:user')->prefix('users')->group(function () {
        Route::get('{user}/achievements', [UserAchievementController::class, 'index']);
    });

    // Admin-specific routes
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('users/achievements', [AdminAchievementController::class, 'index']);
    });
});