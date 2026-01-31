const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration
const BACKEND_IP = process.env.BACKEND_URL || "http://localhost"; // VM 2 IP
const USER_ID = "demo_user";
const PORT = 3000; // Internal Port

// Helper to get Cart Count
async function getCartCount() {
    try {
        const res = await axios.get(`${BACKEND_IP}:3003/cart/${USER_ID}`);
        // Sum up the quantity of all items
        return res.data.items.reduce((sum, item) => sum + item.quantity, 0);
    } catch (e) {
        return 0;
    }
}

// 1. Home Page (Updated to fetch Cart Count)
app.get("/", async (req, res) => {
    try {
        console.log(`[Frontend] Loading Home Page...`);

        // Run requests in parallel for speed
        const [productsRes, cartCount] = await Promise.all([
            axios.get(`${BACKEND_IP}:3001/products`),
            getCartCount(),
        ]);

        res.render("index", {
            products: productsRes.data,
            cartCount: cartCount,
            query: req.query, // Pass query params to trigger toasts
        });
    } catch (e) {
        console.error("Error loading home:", e.message);
        res.render("index", {
            products: [],
            cartCount: 0,
            query: { error: "Backend Offline" },
        });
    }
});

// 2. Add to Cart (Updated Redirect)
app.post("/cart/add", async (req, res) => {
    try {
        await axios.post(`${BACKEND_IP}:3003/cart/${USER_ID}/add`, {
            productId: req.body.productId,
            name: req.body.name,
            price: req.body.price,
        });
        // Redirect with ?action=added flag
        res.redirect("/?action=added");
    } catch (e) {
        res.redirect("/?error=failed_add");
    }
});

// 3. Checkout (Updated Redirect)
app.post("/checkout", async (req, res) => {
    try {
        const cartRes = await axios.get(`${BACKEND_IP}:3003/cart/${USER_ID}`);
        const items = cartRes.data.items;

        if (items.length > 0) {
            await axios.post(`${BACKEND_IP}:3002/checkout`, {
                userId: USER_ID,
                items,
            });
            await axios.delete(`${BACKEND_IP}:3003/cart/${USER_ID}`);
            // Redirect with ?status=success flag
            res.redirect("/?status=success");
        } else {
            res.redirect("/cart");
        }
    } catch (e) {
        res.redirect("/?status=failed");
    }
});

// ... (Keep /cart, /seed and app.listen as they were) ...
// Just ensure the /cart route also passes a cartCount if you want the badge there too,
// but strictly speaking, it's most important on the Home Page.

// Standard Cart Route for context:
app.get("/cart", async (req, res) => {
    const response = await axios.get(`${BACKEND_IP}:3003/cart/${USER_ID}`);
    res.render("cart", { cart: response.data });
});

app.post("/seed", async (req, res) => {
    await axios.post(`${BACKEND_IP}:3001/seed`);
    res.redirect("/");
});

app.listen(PORT, () => console.log(`Frontend running on ${PORT}`));
