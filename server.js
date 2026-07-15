const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// 1. CORS Configuration - Strict and Reliable
app.use(cors({
    origin: '*', // Allow all origins to connect
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 2. Static Files (Uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Dynamic Route Loader
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
    try {
        app.use(route.path, require(route.file));
        console.log(`✅ Loaded: ${route.path}`);
    } catch (err) {
        console.error(`❌ FAILED to load: ${route.file}`, err.message);
    }
});

// 4. Base Route
app.get('/', (req, res) => {
    res.json({ message: "Stock Manager ERP Backend is Live and Running!" });
});

// 5. Database & Server Start
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/erp_system';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB Successfully!');

        // --- Admin Setup Logic ---
        try {
            const User = require('./models/User');
            const bcrypt = require('bcryptjs');
            const myEmail = "aslamabdullah288@gmail.com";
            
            const adminExists = await User.findOne({ email: myEmail });
            if (!adminExists) {
                const hashedPassword = await bcrypt.hash("12345678", 10);
                const admin = new User({
                    name: "Abdullah Admin",
                    email: myEmail,
                    password: hashedPassword,
                    role: 'admin'
                });
                await admin.save();
                console.log("🎯 Fresh Admin User created!");
            }
        } catch (e) {
            console.log("Admin setup skip (already exists or error).");
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port: ${PORT}`);
        });
    })
    .catch(err => console.error('❌ Database Connection Error:', err.message));