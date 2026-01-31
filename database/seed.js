// database/seed.js

// 1. Connect to the database (Auto-selected by the shell context)
db = db.getSiblingDB("shopdb");

// 2. Clear existing collections
print(" Clearing old data...");
db.products.drop();
db.orders.drop();
db.carts.drop();

// 3. Insert New Products (Edit this list to change data!)
print(" Inserting new products...");
db.products.insertMany([
    {
        name: "Gaming Laptop",
        price: 1500,
        stock: 5,
        image: "💻",
    },
    {
        name: "Mechanical Keyboard",
        price: 150,
        stock: 10,
        image: "⌨️",
    },
    {
        name: "Wireless Mouse",
        price: 50,
        stock: 20,
        image: "🖱️",
    },
    {
        name: "4K Monitor",
        price: 400,
        stock: 3,
        image: "🖥️",
    },
    {
        name: "Gaming Headset",
        price: 120,
        stock: 8,
        image: "🎧",
    },
]);

print(" Database Seeded Successfully!");
