<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create the Users Table
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable(); // Nullable for Google users
            
            $table->string('role')->default('user'); 
            $table->boolean('is_approved')->default(true);
            
            $table->string('google_id')->nullable(); 
            $table->text('google_token')->nullable(); 
            
            $table->rememberToken();
            $table->timestamps();
        });

        // 2. Create the Password Reset Tokens Table (The "2FA" parking spot)
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token'); // This stores the hashed 6-digit code
            $table->timestamp('created_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
    }
};