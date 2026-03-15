<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class TeamController extends Controller
{
    /**
     * Fetch all team members for the Admin panel.
     */
    public function index()
    {
        return response()->json(Team::latest()->get());
    }

    /**
     * Create a new Driver / Team Member.
     */
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'full_name'      => 'required|string|max:255',
                'company_email'  => 'required|email|unique:teams,company_email',
                'assigned_truck' => 'required|string',
                'phone'          => 'required|string'
            ]);

            // Set an unguessable placeholder password.
            // The driver MUST use a setup link to access the account.
            $data['password'] = Hash::make(Str::random(16)); 
            $data['status']   = 'active';

            $member = Team::create($data);

            return response()->json([
                'message' => 'Team member added! Generate a setup link for them next.',
                'member'  => $member
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error("Team Creation Error: " . $e->getMessage());
            return response()->json(['message' => 'Internal Server Error'], 500);
        }
    }

    /**
     * Generate a Secure Reset/Setup Link (Admin Only).
     */
    public function generateResetLink(Request $request, $id) 
    {
        try {
            $member = Team::findOrFail($id);

            // SECURITY CHECK: Only active employees can get a link
            if ($member->status !== 'active') {
                return response()->json(['message' => 'Cannot reset password for inactive employees.'], 403);
            }

            // Generate a temporary token valid for 30 minutes
            $token = Str::random(64);
            
            // Store token in cache linked to the driver's ID
            Cache::put('team_reset_' . $token, $member->id, now()->addMinutes(30));

            // Create the frontend URL
            $resetLink = env('FRONTEND_URL', 'http://localhost:5173') . "/driver/set-password?token=" . $token;

            return response()->json([
                'reset_url' => $resetLink,
                'message' => 'Secure link generated! Expires in 30 minutes.'
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Could not generate link.'], 500);
        }
    }

    /**
     * Finalize Password (Driver Action via the Secure Link).
     * This is a PUBLIC route (driver is not logged in yet).
     */
    public function finalizePassword(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8'
        ]);

        // Retrieve the driver ID associated with this token
        $driverId = Cache::get('team_reset_' . $request->token);

        if (!$driverId) {
            return response()->json(['message' => 'This link is invalid or has expired.'], 400);
        }

        // Update the password
        $driver = Team::findOrFail($driverId);
        $driver->update([
            'password' => Hash::make($request->password)
        ]);

        // Destroy the token so it can't be reused
        Cache::forget('team_reset_' . $request->token);

        return response()->json(['message' => 'Identity secured. Password updated.']);
    }
    
    /**
     * Remove a team member.
     */
    public function destroy($id)
    {
        $member = Team::findOrFail($id);
        $member->delete();
        return response()->json(['message' => 'Member removed from fleet.']);
    }
}