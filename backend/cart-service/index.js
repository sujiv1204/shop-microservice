const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shopdb";
mongoose.connect(MONGO_URI).then(() => console.log(" Cart DB Connected"));

const Cart = mongoose.model(
    "Cart",
    new mongoose.Schema({
        userId: String,
        items: [
            {
                productId: String,
                name: String,
                price: Number,
                quantity: Number,
            },
        ],
    }),
);

app.get("/cart/:userId", async (req, res) => {
    console.log(`[Cart] Fetching cart for user: ${req.params.userId}`);
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart)
        cart = await new Cart({ userId: req.params.userId, items: [] }).save();
    res.json(cart);
});

app.post("/cart/:userId/add", async (req, res) => {
    const { productId, name, price } = req.body;
    console.log(`[Cart] Adding item to cart: ${name}`);

    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) cart = new Cart({ userId: req.params.userId, items: [] });

    const idx = cart.items.findIndex((p) => p.productId == productId);
    if (idx > -1) cart.items[idx].quantity++;
    else cart.items.push({ productId, name, price, quantity: 1 });

    await cart.save();
    res.json(cart);
});

app.delete("/cart/:userId", async (req, res) => {
    console.log(`[Cart] Clearing cart for user: ${req.params.userId}`);
    await Cart.findOneAndDelete({ userId: req.params.userId });
    res.json({ success: true });
});

app.listen(3003, () => console.log(" Cart Service running on 3003"));
