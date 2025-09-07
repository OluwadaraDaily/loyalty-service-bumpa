<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('customer/dashboard');
    })->name('dashboard');

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/', function () {
            return Inertia::render('admin/dashboard');
        })->name('admin.dashboard');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
