<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Team; // <-- IMPORTED TEAM MODEL
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
     * --- DRIVER LOGIN ---
     * Authenticates fleet members using the 'teams' table.
     */
    public function driverLogin(Request $request)
    {
        $request->validate([
            'company_email' => 'required|email',
            'password' => 'required',
        ]);

        // Look for the driver in the 'teams' table specifically
        $driver = Team::where('company_email', $request->company_email)->first();

        if (!$driver || !Hash::check($request->password, $driver->password)) {
            return response()->json(['message' => 'Invalid company credentials.'], 401);
        }

        // Generate a driver-specific token
        $token = $driver->createToken('driver_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $driver->id,
                'name' => $driver->full_name,
                'email' => $driver->company_email,
                'assigned_truck' => $driver->assigned_truck,
                'role' => 'driver' // Adding role for frontend routing
            ]
        ]);
    }

    // --- ADMIN LOGIN (SECURE SANCTUM INTEGRATION) ---
    
    public function adminLogin(Request $request) 
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $adminEmail = "admin@rapidroute.in";
        $adminPass = "admin123"; 

        if ($request->email === $adminEmail && $request->password === $adminPass) {
            
            // Ensure the admin actually exists in the database so Sanctum can issue a real token
            $admin = User::firstOrCreate(
                ['email' => $adminEmail],
                [
                    'name' => 'Root Admin', 
                    'password' => Hash::make($adminPass), 
                    'role' => 'admin', 
                    'is_approved' => true
                ]
            );

            // Generate a REAL Sanctum token
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
                'email' => $googleUser->email, 
            ], [
                'name' => $googleUser->name,
                'google_id' => $googleUser->id,
                'google_token' => $googleUser->token,
                'is_approved' => true, 
                'role' => 'user',
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;
            return redirect("http://localhost:5173/login-success?token={$token}");

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
}