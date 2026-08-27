const fs = require('fs');
const path = require('path');

const envPath = fs.existsSync(path.join(__dirname, '.env'))
  ? path.join(__dirname, '.env')
  : fs.existsSync(path.join(__dirname, 'env'))
    ? path.join(__dirname, 'env')
    : null;

if (envPath) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const mongoose = require('mongoose');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const Review = require('./src/models/Review');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wagh-ecommerce';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🌱 Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Review.deleteMany();

    console.log('🧹 Cleared existing database records.');

    // Seed Users
    const adminUser = await User.create({
      name: 'WAGH Admin',
      email: 'admin@wagh.com',
      password: 'admin123password',
      role: 'admin',
      addresses: [{
        street: 'WAGH HQ, Tech Park, Block B',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380015',
        phone: '+91 90544 05305',
        isDefault: true
      }]
    });

    const demoCustomer = await User.create({
      name: 'Devang Panchal',
      email: 'devang@example.com',
      password: 'customer123password',
      role: 'customer',
      addresses: [{
        street: '42 Speed Avenue, Sector 4',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        phone: '+91 98765 43210',
        isDefault: true
      }]
    });

    console.log('👤 Created Admin & Demo Customer accounts.');

    // Seed Categories
    const categories = await Category.insertMany([
      {
        name: 'Chargers & Adapters',
        slug: 'chargers-adapters',
        description: 'Super fast GaN chargers, PD adapters, and dual-port power bricks built for extreme speed.',
        icon: 'Zap'
      },
      {
        name: 'Power Banks',
        slug: 'power-banks',
        description: 'High-capacity, fast-charging portable power banks and MagSafe wireless battery packs.',
        icon: 'BatteryCharging'
      },
      {
        name: 'Cables & Connectors',
        slug: 'cables-connectors',
        description: 'Heavy-duty braided Type-C, Lightning, and 100W PD fast charging cables.',
        icon: 'Cable'
      },
      {
        name: 'Audio & Wireless',
        slug: 'audio-wireless',
        description: 'TWS earbuds with ANC, Bluetooth neckbands, and premium acoustic accessories.',
        icon: 'Headphones'
      }
    ]);

    console.log('📂 Created 4 Product Categories.');

    // Empty Products Array - Ready for Manual or AI Product Additions
    const productsData = [];

    const createdProducts = await Product.insertMany(productsData);
    console.log(`⚡ Cleared all products. Ready for fresh product data entry.`);

    console.log('✅ WAGH Database Cleaned Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();
