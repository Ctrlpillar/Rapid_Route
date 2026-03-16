<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Order extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     * * These match your AddOrder.tsx fields exactly.
     */
    protected $fillable = [
        'tracking_number', 
        'customer_name', 
        'customer_email', 
        'customer_phone', 
        'delivery_location', 
        'carrier', 
        'zipcode',
        'item_name', 
        'weight',
        'status'
        
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}