<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // User dashboard - only accessible by users with 'user' role
    Route::middleware('role:user')->get('dashboard', function () {
        return Inertia::render('customer/dashboard');
    })->name('dashboard');

    // Admin routes - only accessible by users with 'admin' role
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/', function () {
            return Inertia::render('admin/dashboard');
        })->name('admin.dashboard');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
