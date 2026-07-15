
const mongoose = require('mongoose');
require('dotenv').config();

// Connect URI from .env
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/erp_system';

// Dynamic Schemas (In-file definitions to prevent path errors)
const CategorySchema = new mongoose.Schema({ name: String, description: String }, { timestamps: true });
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

const SupplierSchema = new mongoose.Schema({
  name: String,
  contactPerson: String,
  phone: String,
  email: String,
  address: String
}, { timestamps: true });
const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);

// 🛒 Top Trending Market Categories
const marketCategories = [
  { name: 'Smartphones & Accessories', description: 'Mobiles, chargers, covers, and headphones' },
  { name: 'Laptops & Computers', description: 'Laptops, desktops, RAM, SSDs, and keyboards' },
  { name: 'Home Appliances', description: 'AC, Refrigerator, Microwave, and Fans' },
  { name: 'Groceries & Essentials', description: 'Daily use items, food, and drinks' },
  { name: 'Fashion & Apparel', description: 'Clothes, shoes, and lifestyle products' },
  { name: 'Cosmetics & Care', description: 'Perfumes, makeup, and skincare items' }
];

// 🏢 Top Market Suppliers/Brands
const marketSuppliers = [
  { name: 'Apple Inc.', contactPerson: 'Tim Cook', phone: '+198765432', email: 'supply@apple.com', address: 'California, USA' },
  { name: 'Samsung Electronics', contactPerson: 'Han Jong', phone: '+82101234', email: 'supply@samsung.com', address: 'Seoul, South Korea' },
  { name: 'Unilever Pakistan', contactPerson: 'Ali Khan', phone: '021-111864', email: 'pak.info@unilever.com', address: 'Karachi, Pakistan' },
  { name: 'Nestlé Pakistan', contactPerson: 'Zainab Ahmed', phone: '042-111637', email: 'nestle.supply@pk.nestle.com', address: 'Lahore, Pakistan' },
  { name: 'Xiaomi Official', contactPerson: 'Chen Liu', phone: '+86123456', email: 'global.supply@xiaomi.com', address: 'Beijing, China' },
  { name: 'Local Wholesale Distributor', contactPerson: 'Muhammad Rizwan', phone: '0300-1234567', email: 'local.dist@gmail.com', address: 'Faisalabad, Pakistan' }
];

async function seedDB() {
  try {
    console.log('🔄 Connecting to Database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Successfully!');

    // 1. Seed Categories
    await Category.deleteMany({});
    console.log('🗑️ Cleaning old categories...');
    await Category.insertMany(marketCategories);
    console.log('✅ Market Categories added successfully!');

    // 2. Seed Suppliers
    await Supplier.deleteMany({});
    console.log('🗑️ Cleaning old suppliers...');
    await Supplier.insertMany(marketSuppliers);
    console.log('✅ Market Suppliers/Brands added successfully!');

    console.log('\n🎉 SUCCESS! Your database is now packed with top-trending Categories & Suppliers.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding database:', err.message);
    process.exit(1);
  }
}

seedDB();