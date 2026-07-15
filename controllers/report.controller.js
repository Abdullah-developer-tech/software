const Invoice = require('../models/Invoice');
const Product = require('../models/Product');

// 1. Dashboard Stats (Advanced stats tailored exactly for DashboardPanel.jsx)
const getDashboardStats = async (req, res) => {
    try {
        // A. Total products & low stock items calculations
        const totalProducts = await Product.countDocuments();
        
        // Find all actual low stock items where quantity <= minStock
        const lowStockItems = await Product.find({ 
            $expr: { $lte: ["$quantity", "$minStock"] } 
        }).select('name sku quantity minStock');
        
        const lowStockCount = lowStockItems.length;

        // B. Total Stock/Inventory value (Sum of quantity * buyingPrice or price)
        const allProducts = await Product.find({});
        let totalStockValue = 0;
        allProducts.forEach(p => {
            const price = p.buyingPrice || p.price || 0;
            totalStockValue += (p.quantity * price);
        });

        // C. Invoice calculations
        const invoices = await Invoice.find({});
        let revenueThisMonth = 0;
        let outstandingAmount = 0;
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        invoices.forEach(inv => {
            const grandTotal = inv.grandTotal || inv.total || 0;
            const paid = inv.amountPaid || inv.paidAmount || 0;
            const due = inv.dueAmount || (grandTotal - paid);

            outstandingAmount += due > 0 ? due : 0;

            // Calculate revenue for current calendar month
            if (inv.createdAt && new Date(inv.createdAt) >= startOfMonth) {
                revenueThisMonth += paid; 
            }
        });

        // Response matches exactly what DashboardPanel.jsx reads!
        res.json({
            totalProducts,
            totalStockValue,
            revenueThisMonth,
            lowStockCount,
            lowStockItems, // Sends list to fill Low Stock Alerts card
            outstandingAmount,
            totalInvoices: invoices.length
        });
    } catch (error) {
        console.error("❌ Dashboard Calculation Error:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// 2. Sales Report with Daily Trend Grouping
const getSalesReport = async (req, res) => {
    try {
        const fromDate = req.query.from || req.query.startDate;
        const toDate = req.query.to || req.query.endDate;

        let query = {};
        if (fromDate) {
            query.createdAt = { $gte: new Date(fromDate) };
        }
        if (toDate) {
            query.createdAt = { ...query.createdAt, $lte: new Date(toDate) };
        }

        const invoices = await Invoice.find(query);
        let totalRevenue = 0;
        const dailyMap = {};

        invoices.forEach(inv => {
            const invoiceTotal = inv.grandTotal || inv.total || 0;
            totalRevenue += invoiceTotal;

            if (inv.createdAt) {
                const dateKey = new Date(inv.createdAt).toISOString().slice(0, 10);
                if (!dailyMap[dateKey]) {
                    dailyMap[dateKey] = { date: dateKey, revenue: 0, invoiceCount: 0 };
                }
                dailyMap[dateKey].revenue += invoiceTotal;
                dailyMap[dateKey].invoiceCount += 1;
            }
        });

        const dailyArray = Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({
            totalRevenue,
            invoiceCount: invoices.length,
            daily: dailyArray
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Top Selling Products logic for BarChart
const getTopProductsReport = async (req, res) => {
    try {
        const fromDate = req.query.from || req.query.startDate;
        const toDate = req.query.to || req.query.endDate;

        let query = {};
        if (fromDate && toDate) {
            query.createdAt = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            };
        }

        const invoices = await Invoice.find(query);
        const productMap = {};

        invoices.forEach(inv => {
            if (inv.items && Array.isArray(inv.items)) {
                inv.items.forEach(item => {
                    const prodId = item.product ? item.product.toString() : 'unknown';
                    const name = item.name || 'Product';
                    const qty = Number(item.quantity) || 0;
                    const price = Number(item.price) || 0;
                    const total = Number(item.total) || (qty * price);

                    if (!productMap[prodId]) {
                        productMap[prodId] = { productId: prodId, name, unitsSold: 0, revenue: 0 };
                    }
                    productMap[prodId].unitsSold += qty;
                    productMap[prodId].revenue += total;
                });
            }
        });

        const sortedProducts = Object.values(productMap)
            .sort((a, b) => b.unitsSold - a.unitsSold)
            .slice(0, 7);

        res.json(sortedProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Low stock report
const getLowStockReport = async (req, res) => {
    try {
        const lowStock = await Product.find({ $expr: { $lte: ["$quantity", "$minStock"] } }).populate('category supplier');
        res.json(lowStock);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Clear and Explicit Module Exports
module.exports = {
    getDashboardStats,
    getSalesReport,
    getTopProductsReport,
    getLowStockReport
};