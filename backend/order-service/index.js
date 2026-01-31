const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shopdb";

mongoose
    .connect(MONGO_URI)
    .then(() => console.log(`Order DB Connected at ${MONGO_URI}`))
    .catch((err) => console.error("DB Error:", err));

const Order = mongoose.model(
    "Order",
    new mongoose.Schema({
        productId: String,
        date: { type: Date, default: Date.now },
        status: String,
    }),
);

// URL of the Inventory Service (Running on the same VM 192.168.122.11)
const INVENTORY_URL =
    process.env.INVENTORY_URL || "http://localhost:3001/products/deduct";

app.post("/orders", async (req, res) => {
    const { productId } = req.body;
    try {
        console.log(`Contacting Inventory Service at: ${INVENTORY_URL}`);

        // Use the Env Variable URL here
        const response = await axios.post(`${INVENTORY_URL}/${productId}`);

        if (response.data.success) {
            const newOrder = new Order({ productId, status: "Confirmed" });
            await newOrder.save();
            res.json({
                success: true,
                message: "Order Placed!",
                stockLeft: response.data.newStock,
            });
        }
    } catch (error) {
        console.error("Order failed:", error.message);
        res.status(400).json({
            success: false,
            message: "Transaction Failed: Out of Stock or Error",
        });
    }
});

app.get("/orders", async (req, res) => {
    const orders = await Order.find();
    res.json(orders);
});

app.listen(3002, () => console.log(" Order Service running on 3002"));
