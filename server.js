const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const routesToLoad = [
    { path: '/api/auth', file: './routes/auth.routes' },
    { path: '/api/products', file: './routes/product.routes' },
    { path: '/api/categories', file: './routes/category.routes' },
    { path: '/api/suppliers', file: './routes/supplier.routes' },
    { path: '/api/customers', file: './routes/customer.routes' },
    { path: '/api/stock', file: './routes/stock.routes' },
    { path: '/api/invoices', file: './routes/invoice.routes' },
    { path: '/api/reports', file: './routes/report.routes' },
    { path: '/api/users', file: './routes/user.routes' }
];

routesToLoad.forEach(route => {
    try { app.use(route.path, require(route.file)); } catch (err) { console.error(`❌ Failed: ${route.file}`); }
});

app.get('/', (req, res) => res.json({ message: "Stock Manager ERP Backend is Live!" }));

// Database Connection & Serverless Handler
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    return mongoose.connect(process.env.MONGODB_URI);
};

// Vercel Export
module.exports = async (req, res) => {
    await connectDB();
    return app(req, res);
};

// Local Development
if (process.env.NODE_ENV !== 'production') {
    const PORT = 5000;
    connectDB().then(() => {
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    });
}