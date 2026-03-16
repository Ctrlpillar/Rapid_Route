import csv
import random

# Configuration
filename = "bulk_test_data.csv"
num_records = 100

# Data pools for variety
first_names = ["Arjun", "Sarah", "Euan", "Priya", "Rohan", "Anjali", "Vikram", "Deepa", "Kevin", "Sneha"]
last_names = ["Sharma", "D'Souza", "Fernandes", "Naik", "Gupta", "Pereira", "Sinha", "Mendes", "Kamat", "Vaz"]
items = ["Smartphone", "Gaming Laptop", "Bluetooth Speaker", "Smart Watch", "Coffee Machine", "Football Boots", "Running Shoes", "Wireless Headphones", "Mechanical Keyboard", "Tablet"]
locations = ["Altinho, Panaji", "Anjuna Beach Rd", "Margao Market Area", "Baina, Vasco", "Ponda City Center", "Candolim Main St", "Calangute", "Mapusa Market", "Old Goa", "Colva Beach Rd"]

routes = [
    "Truck 01 - Panjim & Tiswadi",
    "Truck 02 - Mapusa & North Coastal",
    "Truck 03 - Margao & South Coastal",
    "Truck 04 - Vasco & Mormugao",
    "Truck 05 - Ponda & Inland"
]

zipcodes = ["403001", "403507", "403701", "403802", "403401"]

# Generate
with open(filename, mode='w', newline='') as file:
    writer = csv.writer(file)
    # Headers exactly as Laravel expects (Added 'weight')
    writer.writerow(["tracking_number", "item_name", "weight", "customer_name", "customer_email", "customer_phone", "zipcode", "delivery_location", "carrier"])
    
    for i in range(1, num_records + 1):
        f_name = random.choice(first_names)
        l_name = random.choice(last_names)
        full_name = f"{f_name} {l_name}"
        email = f"{f_name.lower()}.{l_name.lower()}{i}@example.com"
        tracking = f"RR-{random.randint(100, 999)}-{random.randint(100, 999)}-{i:03d}"
        phone = f"+919{random.randint(100000000, 999999999)}"
        
        # Random weight between 10g and 2000g
        weight = random.randint(10, 2000)
        
        # Pick a random route and its matching zipcode
        route_idx = random.randint(0, 4)
        
        writer.writerow([
            tracking,
            random.choice(items),
            weight,  # New Column
            full_name,
            email,
            phone,
            zipcodes[route_idx],
            random.choice(locations),
            routes[route_idx]
        ])

print(f"Successfully generated {filename} with {num_records} orders (including random weights)!")