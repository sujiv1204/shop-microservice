require('dotenv').config(); // Load env vars
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- ENVIRONMENT VARIABLES ---
const PORT = process.env.PORT || 3000;
// Default to localhost if not provided (for local testing), but we will inject the VM IP
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shopdb';

console.log(`Attempting to connect to DB at: ${MONGO_URI}`);

mongoose.connect(MONGO_URI)
    .then(() => console.log(" MongoDB Connected"))
    .catch(err => console.error(" DB Connection Error:", err));

// Schemas
const Product = mongoose.model('Product', new mongoose.Schema({
    name: String, price: Number, stock: Number, image: String
}));

// Routes
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) { res.status(500).json({error: err.message}); }
});

app.post('/buy/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        if (product.stock > 0) {
            product.stock -= 1;
            await product.save();
            res.json({ success: true, message: `Purchased ${product.name}!`, stock: product.stock });
            console.log(` Product purchased: ${product.name}, Remaining stock: ${product.stock}`);
        } else {
            res.status(400).json({ success: false, error: "Out of Stock" });
            console.log(` Purchase failed: ${product.name} is out of stock.`);
        }
    } catch (err) { res.status(500).json({error: err.message}); }
});

app.listen(PORT, () => console.log(` Backend running on port ${PORT}`));