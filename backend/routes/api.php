<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\TeamController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Authentication (Customers & Admins)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/admin/login', [AuthController::class, 'adminLogin']);

// --- DRIVER AUTH (PUBLIC) ---
Route::post('/driver/login', [AuthController::class, 'driverLogin']);
Route::post('/driver/finalize-password', [TeamController::class, 'finalizePassword']); 

// Password Reset Flow
Route::post('/forgot-password', [AuthController::class, 'sendResetCode']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Logistics Admin Endpoints (Master list)
Route::get('/orders', [OrderController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::post('/orders/bulk-upload', [OrderController::class, 'bulkUpload']); 
Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
Route::delete('/orders/{id}', [OrderController::class, 'destroy']);

// Google Auth
Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);


/*
|--------------------------------------------------------------------------
| Protected Routes (Requires Sanctum Token)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    
    // User Profile Management
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/user/update', [UserController::class, 'update']);
    Route::post('/user/update-password', [UserController::class, 'updatePassword']);

    // Account Security
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // --- CUSTOMER MANAGEMENT (Admin Only) ---
    Route::get('/admin/users', [UserController::class, 'index']); // <-- ADDED THIS LINE

    // --- SECURE TRACKING & HISTORY ---
    Route::get('/track/{tracking_number}', [OrderController::class, 'trackOrder']);
    Route::get('/user/order-history', [OrderController::class, 'userHistory']);

    // --- DRIVER CONSOLE ROUTES ---
    Route::get('/driver/manifest', [OrderController::class, 'driverManifest']);
    Route::patch('/driver/update-status/{id}', [OrderController::class, 'driverUpdateStatus']);

    // --- FLEET TEAM MANAGEMENT (Admin Only) ---
    Route::get('/admin/team', [TeamController::class, 'index']);
    Route::post('/admin/team', [TeamController::class, 'store']);
    Route::get('/admin/team/{id}/reset-link', [TeamController::class, 'generateResetLink']); 
    Route::delete('/admin/team/{id}', [TeamController::class, 'destroy']);
    
});