const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// Target VM 2 IP
const BACKEND_IP = "http://192.168.122.11";
const USER_ID = "demo_user";

app.get("/", async (req, res) => {
    try {
        console.log("------------------------------------------------");
        console.log(`[Frontend] User requested Home Page.`);
        console.log(`[Frontend] Calling Backend VM2 (Inventory Service)...`);
        const response = await axios.get(`${BACKEND_IP}:3001/products`);
        res.render("index", { products: response.data });
    } catch (e) {
        console.error(`[Frontend] Error contacting Backend: ${e.message}`);
        res.render("index", { products: [], error: "Backend Offline" });
    }
});

app.get("/cart", async (req, res) => {
    console.log(
        `[Frontend] Calling Backend VM2 (Cart Service) to view cart...`,
    );
    const response = await axios.get(`${BACKEND_IP}:3003/cart/${USER_ID}`);
    res.render("cart", { cart: response.data });
});

app.post("/cart/add", async (req, res) => {
    console.log(
        `[Frontend] Sending 'Add to Cart' request to Backend VM2...`,
    );
    await axios.post(`${BACKEND_IP}:3003/cart/${USER_ID}/add`, {
        productId: req.body.productId,
        name: req.body.name,
        price: req.body.price,
    });
    res.redirect("/");
});

app.post("/checkout", async (req, res) => {
    console.log("------------------------------------------------");
    console.log(`[Frontend] Checkout initiated!`);

    // 1. Get Items
    const cartRes = await axios.get(`${BACKEND_IP}:3003/cart/${USER_ID}`);
    const items = cartRes.data.items;

    if (items.length > 0) {
        // 2. Send to Order Service
        console.log(
            `[Frontend] Forwarding Checkout to Order Service (VM2)...`,
        );
        try {
            await axios.post(`${BACKEND_IP}:3002/checkout`, {
                userId: USER_ID,
                items,
            });
            // 3. Clear Cart
            await axios.delete(`${BACKEND_IP}:3003/cart/${USER_ID}`);
            console.log(`[Frontend] Transaction Complete.`);
            res.redirect("/?status=success");
        } catch (e) {
            res.redirect("/?status=failed");
        }
    } else {
        res.redirect("/cart");
    }
});

app.post("/seed", async (req, res) => {
    console.log(`[Frontend] Sending Seed Request to Inventory Service...`);
    await axios.post(`${BACKEND_IP}:3001/seed`);
    res.redirect("/");
});

const PORT = 3000; // Internal port, not exposed to VM 1's public IP
app.listen(PORT, () => console.log(`Frontend Node App running internally on port ${PORT}`));