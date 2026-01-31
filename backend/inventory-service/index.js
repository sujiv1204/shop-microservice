const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shopdb";
mongoose.connect(MONGO_URI).then(() => console.log(" Inventory DB Connected"));

const Product = mongoose.model(
    "Product",
    new mongoose.Schema({
        name: String,
        price: Number,
        stock: Number,
        image: String,
    }),
);

// 1. Get All Products
app.get("/products", async (req, res) => {
    console.log(
        `[Inventory]  Received GET request for products ( from Frontend VM 1)`,
    );
    res.json(await Product.find());
});

// 2. Deduct Stock (Internal API)
app.post("/products/deduct/:id", async (req, res) => {
    const qty = req.body.qty || 1;
    console.log(
        `[Inventory] Request from ORDER SERVICE to deduct ${qty} item(s) from product ${req.params.id}`,
    );

    const product = await Product.findById(req.params.id);
    if (!product || product.stock < qty) {
        console.log(`[Inventory] Stock deduction failed: Insufficient stock.`);
        return res.status(400).json({ success: false });
    }

    product.stock -= qty;
    await product.save();
    console.log(`[Inventory] Stock deducted. New stock: ${product.stock}`);
    res.json({ success: true, newStock: product.stock });
});

// 3. Seed DB
app.post("/seed", async (req, res) => {
    console.log(`[Inventory] Seeding Database...`);
    await Product.deleteMany({});
    await Product.insertMany([
        { name: "Gaming Laptop", price: 1500, stock: 5, image: "💻" },
        { name: "Smartphone", price: 800, stock: 10, image: "📱" },
        { name: "Headset", price: 200, stock: 2, image: "🎧" },
    ]);
    res.json({ message: "Seeded!" });
});

app.listen(3001, () => console.log(" Inventory Service running on 3001"));
