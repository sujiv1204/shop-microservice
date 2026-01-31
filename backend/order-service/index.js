const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

const MONGO_URI =
    process.env.MONGO_URI || "mongodb://192.168.122.12:27017/shopdb";
mongoose.connect(MONGO_URI).then(() => console.log(" Order DB Connected"));

// Note: Uses internal Docker DNS name 'inventory'
const INVENTORY_URL =
    process.env.INVENTORY_URL || "http://inventory:3001/products/deduct";

const Order = mongoose.model(
    "Order",
    new mongoose.Schema({
        userId: String,
        items: Array,
        total: Number,
        date: { type: Date, default: Date.now },
    }),
);

app.post("/checkout", async (req, res) => {
    const { userId, items } = req.body;
    console.log(
        `[Order] Checkout request received for User: ${userId} with ${items.length} items.`,
    );

    try {
        for (const item of items) {
            console.log(
                `[Order] Contacting INVENTORY SERVICE to deduct stock for: ${item.name}`,
            );
            const result = await axios.post(
                `${INVENTORY_URL}/${item.productId}`,
                { qty: item.quantity },
            );
            if (!result.data.success)
                throw new Error(`Out of stock: ${item.name}`);
        }

        const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        await new Order({ userId, items, total }).save();

        console.log(
            `[Order] Order processed successfully! Total: $${total}`,
        );
        res.json({ success: true, message: "Order Processed" });
    } catch (e) {
        console.error(`[Order] Checkout Failed: ${e.message}`);
        res.status(400).json({ success: false, message: e.message });
    }
});

app.listen(3002, () => console.log(" Order Service running on 3002"));
