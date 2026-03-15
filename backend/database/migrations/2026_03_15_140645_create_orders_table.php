<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('orders', function (Blueprint $table) {
        $table->id();
        $table->string('item_name')->default('Standard Parcel'); // Add this line
        $table->string('tracking_number')->unique();
        $table->string('customer_name');
        $table->string('customer_email')->nullable();
        $table->string('customer_phone')->nullable();
        $table->string('delivery_location');
        $table->string('zipcode'); // <--- ADD THIS LINE
        $table->string('carrier')->default('RapidRoute');
        $table->string('status')->default('pending');
        $table->timestamps();
    });
}
};
