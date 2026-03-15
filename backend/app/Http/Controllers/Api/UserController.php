<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * --- ADMIN: FETCH ALL CUSTOMERS ---
     * This powers the Users tab in your Admin Panel.
     */
    public function index()
    {
        // We only fetch users with the 'user' role to keep the list clean
        $users = User::where('role', 'user')->latest()->get();
        return response()->json($users);
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'website' => 'nullable|string|max:255',
            'email' => [
                'required', 
                'email', 
                Rule::unique('users')->ignore($user->id) 
            ],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Update the user's password (Standard users only).
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        if ($user->google_id) {
            return response()->json([
                'message' => 'Social accounts must manage passwords via Google.'
            ], 403);
        }

        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'The current password you entered is incorrect.'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json(['message' => 'Password updated successfully!']);
    }

    /**
     * Delete a user from the system.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        
        return response()->json(['message' => 'User account successfully removed.']);
    }
}