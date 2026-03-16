<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Team; 
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\ResetCodeMail;
use Laravel\Socialite\Facades\Socialite;
use Exception;

class AuthController extends Controller
{
    /**
     * --- DASHBOARD OVERVIEW STATS ---
     * Fetches live counts for Admin overview cards.
     */
    public function getAdminStats()
    {
        try {
            return response()->json([
                'total_shipments' => Order::count(),
                'total_customers' => User::where('role', 'user')->count(),
                'active_fleet'    => Team::count(),
                'pending_orders'  => Order::where('status', 'pending')->count(),
            ]);
        } catch (Exception $e) {
            return response()->json(['message' => 'Error fetching stats'], 500);
        }
    }

    /**
     * --- DRIVER LOGIN ---
     */
    public function driverLogin(Request $request)
    {
        $request->validate([
            'company_email' => 'required|email',
            'password' => 'required',
        ]);

        $driver = Team::where('company_email', $request->company_email)->first();

        if (!$driver || !Hash::check($request->password, $driver->password)) {
            return response()->json(['message' => 'Invalid company credentials.'], 401);
        }

        $token = $driver->createToken('driver_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $driver->id,
                'name' => $driver->full_name,
                'email' => $driver->company_email,
                'assigned_truck' => $driver->assigned_truck,
                'role' => 'driver' 
            ]
        ]);
    }

    // --- ADMIN LOGIN ---
    public function adminLogin(Request $request) 
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $adminEmail = "admin@rapidroute.in";
        $adminPass = "admin123"; 

        if ($request->email === $adminEmail && $request->password === $adminPass) {
            
            $admin = User::firstOrCreate(
                ['email' => $adminEmail],
                [
                    'name' => 'Root Admin', 
                    'password' => Hash::make($adminPass), 
                    'role' => 'admin', 
                    'is_approved' => true
                ]
            );

            $token = $admin->createToken('admin_token')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => [
                    'name' => 'Root Admin', 
                    'email' => $adminEmail, 
                    'role' => 'admin'
                ]
            ]);
        }

        return response()->json(['message' => 'Invalid Admin Credentials'], 401);
    }

    // --- FORGOT PASSWORD / 2FA METHODS ---
    public function sendResetCode(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'This email address is not registered.'], 404);
        }

        if ($user->google_id) {
            return response()->json(['message' => 'This account is linked with Google.'], 403);
        }

        $code = rand(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => Hash::make($code), 
                'created_at' => now()
            ]
        );

        try {
            Mail::to($request->email)->send(new ResetCodeMail($code));
            return response()->json(['message' => 'A 6-digit reset code has been sent.']);
        } catch (Exception $e) {
            \Log::error("Mail Error: " . $e->getMessage());
            return response()->json(['message' => 'Could not send the email.'], 500);
        }
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|numeric',
            'password' => 'required|min:6'
        ]);

        $record = DB::table('password_reset_tokens')->where('email', $request->email)->first();

        if (!$record || !Hash::check($request->code, $record->token)) {
            return response()->json(['message' => 'The code is invalid.'], 422);
        }

        if (strtotime($record->created_at) < strtotime('-60 minutes')) {
            return response()->json(['message' => 'This code has expired.'], 422);
        }

        User::where('email', $request->email)->update([
            'password' => Hash::make($request->password)
        ]);

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Your password has been reset successfully!']);
    }

    // --- GOOGLE METHODS ---
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            $user = User::updateOrCreate([
                'email' => $googleUser->getEmail(), 
            ], [
                'name' => $googleUser->getName(),
                'google_id' => $googleUser->getId(),
                'google_token' => $googleUser->token,
                'avatar' => $googleUser->getAvatar(),
                'is_approved' => true, 
                'role' => 'user',
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;
            
            // UPDATED: Now uses environment variable for the redirect
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return redirect($frontendUrl . "/login-success?token={$token}");

        } catch (Exception $e) {
            return response()->json(['error' => 'Google auth failed.'], 500);
        }
    }

    // --- STANDARD AUTH METHODS ---
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'phone' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => 'user',
            'is_approved' => true,
        ]);

        return response()->json([
            'message' => 'User registered successfully',
            'token' => $user->createToken('auth_token')->plainTextToken,
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        if (! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        return response()->json([
            'token' => $user->createToken('auth_token')->plainTextToken,
            'user' => $user 
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    /**
     * --- MANUAL PHOTO UPLOAD ---
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate(['avatar' => 'required|image|max:2048']);
        $user = $request->user();
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => '/storage/' . $path]);

        return response()->json([
            'message' => 'Profile photo updated!',
            'avatar_url' => url('/storage/' . $path)
        ]);
    }
}