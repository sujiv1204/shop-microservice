// This script populates the DB with initial products
db = db.getSiblingDB('shopdb');
db.products.drop(); // Clear old data

db.products.insertMany([
  { name: "Gaming Laptop", price: 1200, stock: 5, image: "💻" },
  { name: "Mechanical Keyboard", price: 150, stock: 10, image: "⌨️" },
  { name: "Wireless Mouse", price: 50, stock: 0, image: "🖱️" }
]);

print("Database seeded successfully!");