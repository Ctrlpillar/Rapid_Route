<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order; 
use App\Models\Team; 
use Illuminate\Http\Request;
use Carbon\Carbon;

class OrderController extends Controller
{
    /**
     * Helper to format grams to kg for the API response.
     */
    private function formatWeight($grams)
    {
        if (!$grams || $grams < 10) $grams = 10;
        
        if ($grams >= 1000) {
            $kg = $grams / 1000;
            // Returns '1kg' if whole, else '1.2kg'
            return (fmod($kg, 1) == 0) ? $kg . 'kg' : number_format($kg, 1) . 'kg';
        }
        return $grams . 'g';
    }

    /**
     * Fetch all orders for the Admin table.
     */
    public function index()
    {
        $orders = Order::latest()->get()->map(function($order) {
            $order->formatted_weight = $this->formatWeight($order->weight);
            return $order;
        });
        return response()->json($orders);
    }

    /**
     * Fetch order history for the logged-in user.
     */
    public function userHistory(Request $request)
    {
        return response()->json(
            Order::where('customer_email', $request->user()->email)
                ->whereIn('status', ['delivered', 'cancelled'])
                ->latest()
                ->get()
        );
    }

    /**
     * DRIVER CONSOLE: Fetch manifest for the assigned truck only.
     */
    public function driverManifest(Request $request)
    {
        $driver = $request->user();
        
        if (!$driver->assigned_truck) {
            return response()->json(['message' => 'No truck assigned to this driver.'], 403);
        }

        $truckPrefix = trim(explode('-', $driver->assigned_truck)[0]);

        return response()->json(
            Order::where('carrier', 'LIKE', $truckPrefix . '%')
                ->whereNotIn('status', ['delivered', 'cancelled'])
                ->latest()
                ->get()
        );
    }

    /**
     * DRIVER CONSOLE: restricted status update.
     */
    public function driverUpdateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,approved,in_transit,out_for_delivery,delivered,cancelled'
        ]);

        $order = Order::findOrFail($id);
        
        $driverTruckPrefix = trim(explode('-', $request->user()->assigned_truck)[0]);
        $orderCarrierPrefix = trim(explode('-', $order->carrier)[0]);

        if ($driverTruckPrefix !== $orderCarrierPrefix) {
            return response()->json(['message' => 'Unauthorized. This parcel is not on your route.'], 403);
        }

        $order->update(['status' => $request->status]);

        return response()->json(['message' => 'Package status updated successfully.']);
    }

    /**
     * Store new orders (Now includes weight).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'orders' => 'required|array',
            'orders.*.tracking_number' => 'required|unique:orders,tracking_number',
            'orders.*.item_name'       => 'nullable|string',
            'orders.*.weight'          => 'nullable|integer', // Added weight validation
            'orders.*.customer_name'   => 'required|string',
            'orders.*.customer_email'  => 'nullable|email',
            'orders.*.customer_phone'  => 'nullable|string',
            'orders.*.delivery_location' => 'required|string',
            'orders.*.zipcode'         => 'required|string',
            'orders.*.carrier'         => 'nullable|string',
            'orders.*.status'          => 'nullable|string',
        ]);

        foreach ($data['orders'] as $orderData) {
            $orderData['item_name'] = $orderData['item_name'] ?? 'Standard Parcel';
            $orderData['weight'] = $orderData['weight'] ?? 10; // Default to 10g
            Order::create($orderData);
        }

        return response()->json([
            'message' => count($data['orders']) . ' orders synced to Neon database!'
        ], 201);
    }

    /**
     * NATIVE CSV BULK UPLOAD (Now supports weight column).
     */
    public function bulkUpload(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:csv,txt|max:2048' 
        ]);

        $file = $request->file('file');
        $fileData = file($file->getRealPath());
        $data = array_map('str_getcsv', $fileData);
        
        $headers = array_shift($data);
        $headers = array_map('trim', $headers);
        $headers = array_map('strtolower', $headers);

        $importedCount = 0;

        foreach ($data as $row) {
            if (count($headers) !== count($row)) continue; 

            $rowData = array_combine($headers, $row);

            Order::create([
                'tracking_number'   => $rowData['tracking_number'] ?? 'RR-' . rand(10000, 99999),
                'item_name'         => $rowData['item_name'] ?? 'Standard Parcel',
                'weight'            => isset($rowData['weight']) ? intval($rowData['weight']) : 10, // Catch weight from CSV
                'customer_name'     => $rowData['customer_name'] ?? 'Unknown Customer',
                'customer_email'    => $rowData['customer_email'] ?? null,
                'customer_phone'    => $rowData['customer_phone'] ?? null,
                'zipcode'           => $rowData['zipcode'] ?? '',
                'delivery_location' => $rowData['delivery_location'] ?? 'Goa',
                'carrier'           => $rowData['carrier'] ?? 'Unassigned',
                'status'            => 'pending',
            ]);

            $importedCount++;
        }

        return response()->json(['message' => "$importedCount orders imported successfully!"]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|string']);
        $order = Order::findOrFail($id);
        $order->update(['status' => $request->status]);
        return response()->json(['message' => 'Order status updated successfully.']);
    }

    public function destroy($id)
    {
        $order = Order::findOrFail($id);
        $order->delete();
        return response()->json(['message' => 'Order removed from system.']);
    }

    /**
     * Public endpoint to track an order (Includes formatted weight).
     */
    public function trackOrder($tracking_number)
    {
        $order = Order::where('tracking_number', $tracking_number)->first();

        if (!$order) {
            return response()->json(['message' => 'Tracking number not found.'], 404);
        }

        $events = [];
        $currentStop = 0;
        
        $created = $order->created_at ? clone $order->created_at : now();
        $updated = $order->updated_at ? clone $order->updated_at : now();

        $events[] = [
            'date' => $created->format('M d, g:i A'),
            'description' => 'Order Received & Processed',
            'location' => 'Panaji Sorting Hub, Goa'
        ];

        // ... [Tracking event logic remains the same] ...
        if (in_array($order->status, ['approved', 'in_transit', 'out_for_delivery', 'delivered'])) {
            $events[] = [
                'date' => (clone $created)->addHours(2)->format('M d, g:i A'),
                'description' => 'Assigned to ' . $order->carrier,
                'location' => 'Panaji Sorting Hub, Goa'
            ];
            $currentStop = 1;
        }

        if (in_array($order->status, ['in_transit', 'out_for_delivery', 'delivered'])) {
            $events[] = [
                'date' => (clone $updated)->subHours(1)->format('M d, g:i A'),
                'description' => 'In Transit towards destination',
                'location' => 'Goa Regional Route'
            ];
            $currentStop = 2;
        }

        if (in_array($order->status, ['out_for_delivery', 'delivered'])) {
            $events[] = [
                'date' => $updated->format('M d, g:i A'),
                'description' => 'Out for Delivery',
                'location' => $order->delivery_location
            ];
            $currentStop = 3;
        }

        if ($order->status === 'delivered') {
            $events[] = [
                'date' => $updated->format('M d, g:i A'),
                'description' => 'Package Delivered',
                'location' => 'Handed to ' . $order->customer_name
            ];
            $currentStop = 4;
        }

        if ($order->status === 'cancelled') {
             $events[] = [
                'date' => $updated->format('M d, g:i A'),
                'description' => 'Shipment Cancelled',
                'location' => 'Contact Support'
            ];
        }

        $targetDate = (clone $created)->addDay()->setTime(18, 0, 0);
        $estDelivery = $order->status === 'delivered' ? 'Delivered' : ($order->status === 'cancelled' ? 'Cancelled' : 'Within 24 Hours');

        $driverPhone = null;
        try {
            $truckPrefix = trim(explode('-', $order->carrier)[0]); 
            $driver = Team::where('assigned_truck', 'LIKE', $truckPrefix . '%')->first();
            $driverPhone = $driver ? $driver->phone : null;
        } catch (\Exception $e) {
            $driverPhone = null; 
        }

        return response()->json([
            'trackingNumber' => $order->tracking_number,
            'status' => ucfirst(str_replace('_', ' ', $order->status)),
            'item' => $order->item_name ?? 'Standard Parcel', 
            'weight' => $this->formatWeight($order->weight), // Formatted for tracking page
            'carrier' => $order->carrier,
            'estimatedDelivery' => $estDelivery,
            'currentLocation' => $order->status === 'delivered' ? $order->delivery_location : 'Goa Route',
            'currentStop' => $currentStop,
            'events' => array_reverse($events),
            'customerName' => $order->customer_name,
            'deliveryAddress' => $order->delivery_location,
            'zipcode' => $order->zipcode,
            'driver_phone' => $driverPhone
        ]);
    }
}