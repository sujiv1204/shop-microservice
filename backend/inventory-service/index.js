const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

// Connect to MongoDB on VM 3
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shopdb";

mongoose
    .connect(MONGO_URI)
    .then(() => console.log(`Inventory DB Connected at ${MONGO_URI}`))
    .catch((err) => console.error("DB Connection Error:", err));

const Product = mongoose.model(
    "Product",
    new mongoose.Schema({
        name: String,
        price: Number,
        stock: Number,
        image: String,
    }),
);

// GET all products
app.get("/products", async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

// INTERNAL API: Deduct Stock (Called by Order Service)
app.post("/products/deduct/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product || product.stock < 1) {
            return res
                .status(400)
                .json({ success: false, message: "Out of Stock" });
        }
        product.stock -= 1;
        await product.save();
        res.json({
            success: true,
            message: "Stock deducted",
            newStock: product.stock,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Seed Data Route
app.post("/seed", async (req, res) => {
    await Product.deleteMany({});
    await Product.insertMany([
        { name: "Gaming Laptop", price: 1200, stock: 5, image: "💻" },
        { name: "Mechanical Keyboard", price: 150, stock: 10, image: "⌨️" },
        { name: "Wireless Mouse", price: 50, stock: 2, image: "🖱️" },
    ]);
    res.json({ message: "Database Seeded!" });
});

app.listen(3001, () => console.log(" Inventory Service running on 3001"));
