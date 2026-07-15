const Product = require('../models/Product');
const mongoose = require('mongoose');

// Dynamic StockLog model loading to keep both directories perfectly synchronized
const StockLog = mongoose.models.StockLog || mongoose.model('StockLog', new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['in', 'out'], required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, default: '' }
}, { timestamps: true }));

// 1. 🔍 Get all products (Safe populate fallbacks taake list crash na ho)
const getProducts = async (req, res) => {
    try {
        // Agar database mein Categories ya Suppliers na bhi hon, tab bhi products perfectly load hon
        const products = await Product.find({})
            .populate({ path: 'category', select: 'name' })
            .populate({ path: 'supplier', select: 'name' })
            .sort({ createdAt: -1 });
            
        return res.json(products);
    } catch (error) {
        console.error("❌ Error in getProducts:", error.message);
        return res.status(500).json({ message: error.message });
    }
};

// 2. Get single product by ID
const getProductById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid Product ID format' });
        }

        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
            .populate('supplier', 'name');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.json(product);
    } catch (error) {
        console.error("❌ Error in getProductById:", error.message);
        return res.status(500).json({ message: error.message });
    }
};

// 3. Create a new product (Multipart support & Auto Stock Log trigger!)
const createProduct = async (req, res) => {
    try {
        // Form fields extract inside Multer parse context
        const { name, sku, category, supplier, quantity, price, minStock, unit } = req.body;
        
        // Manual Validation check to prevent empty mongodb validation crashes
        if (!name || !sku || !category || !supplier) {
            return res.status(400).json({ 
                message: 'Product validation failed: name, sku, category and supplier are required.' 
            });
        }

        const skuExists = await Product.findOne({ sku: sku.trim() });
        if (skuExists) {
            return res.status(400).json({ message: 'Product with this SKU already exists' });
        }

        // Parse local static image url from multer storage file
        let imageUrl = '';
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const product = new Product({
            name: name.trim(),
            sku: sku.trim(),
            category,
            supplier,
            quantity: Number(quantity) || 0,
            price: Number(price) || 0,
            minStock: Number(minStock) || 5,
            unit: unit || 'pcs',
            imageUrl: imageUrl
        });

        const savedProduct = await product.save();

        // 🟢 AUTO STOCK IN TRIGGER: Agar initial quantity 0 se zyada hai, toh ledger entry khud ban jaye!
        if (savedProduct.quantity > 0) {
            const autoLog = new StockLog({
                product: savedProduct._id,
                type: 'in',
                quantity: savedProduct.quantity,
                reason: 'Initial stock added during product creation'
            });
            await autoLog.save();
        }

        return res.status(201).json(savedProduct);
    } catch (error) {
        console.error("❌ Error in createProduct:", error.message);
        return res.status(400).json({ message: error.message });
    }
};

// 4. Update product (Handles image updates safely)
const updateProduct = async (req, res) => {
    try {
        const { name, sku, category, supplier, quantity, price, minStock, unit } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid Product ID format' });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Apply dynamic changes safely
        if (name) product.name = name.trim();
        if (sku) product.sku = sku.trim();
        if (category) product.category = category;
        if (supplier) product.supplier = supplier;
        if (unit) product.unit = unit;

        if (quantity !== undefined) product.quantity = Number(quantity);
        if (price !== undefined) product.price = Number(price);
        if (minStock !== undefined) product.minStock = Number(minStock);

        // Update image only if a new file is uploaded, otherwise keep the old one
        if (req.file) {
            product.imageUrl = `/uploads/${req.file.filename}`;
        }

        const updatedProduct = await product.save();
        return res.json(updatedProduct);
    } catch (error) {
        console.error("❌ Error in updateProduct:", error.message);
        return res.status(400).json({ message: error.message });
    }
};

// 5. Delete product
const deleteProduct = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid Product ID format' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Clean up linked stock logs first to keep DB optimized
        await StockLog.deleteMany({ product: product._id });

        await product.deleteOne();
        return res.json({ message: 'Product and linked logs removed successfully' });
    } catch (error) {
        console.error("❌ Error in deleteProduct:", error.message);
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};