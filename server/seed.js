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

    const catChargers = categories.find(c => c.slug === 'chargers-adapters')._id;
    const catPowerBanks = categories.find(c => c.slug === 'power-banks')._id;
    const catCables = categories.find(c => c.slug === 'cables-connectors')._id;
    const catAudio = categories.find(c => c.slug === 'audio-wireless')._id;

    // Seed 23 Official Products with 108 Self-Hosted Static Image Assets
    const productsData = [
      // 1. 45W Charger
      {
        name: 'WAGH 45W Type-C Super Fast Charger',
        slug: 'wagh-45w-type-c-super-fast-charger',
        description: 'Engineered for maximum power in a sleek, ultra-compact body. Features Super Fast Charging 2.0 protocol (PPS 45W) capable of boosting compatible devices rapidly with aerospace-grade thermal dissipation.',
        price: 749,
        mrp: 1499,
        images: [
          '/product-images/45w-type-c-adopter-1.webp',
          '/product-images/45w-type-c-adopter-2.webp',
          '/product-images/45w-type-c-adopter-3.webp',
          '/product-images/45w-type-c-adopter-4.webp'
        ],
        category: catChargers,
        brand: 'WAGH',
        specs: {
          outputPower: '45W Max PPS / PD 3.0',
          compatibility: 'Universal (Samsung SFC 2.0, iPhone, iPad, Mac, Pixel)',
          warranty: '6 Months Replacement Warranty',
          color: 'Teal & Matte White',
          material: 'Fireproof PC + Metal Accents'
        },
        stock: 150,
        ratingAvg: 4.9,
        ratingCount: 142,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: true
      },
      // 2. 25W VoltXpress
      {
        name: 'WAGH 25W VoltXpress PD Fast Charger',
        slug: 'wagh-25w-voltxpress-pd-fast-charger',
        description: 'High-speed 25W Power Delivery wall adapter designed for quick and efficient daily charging.',
        price: 549,
        mrp: 1099,
        images: [
          '/product-images/25w-voltxprees-pd-1.webp',
          '/product-images/25w-voltxprees-pd-2.webp',
          '/product-images/25w-voltxprees-pd-3.webp',
          '/product-images/25w-voltxprees-pd-4.webp'
        ],
        category: catChargers,
        brand: 'WAGH',
        specs: {
          outputPower: '25W Max Power Delivery',
          compatibility: 'Type-C Smart Devices',
          warranty: '6 Months Warranty',
          color: 'Matte Black',
          material: 'Fireproof PC'
        },
        stock: 120,
        ratingAvg: 4.8,
        ratingCount: 95,
        isFeatured: true,
        isNewArrival: false,
        isBestSeller: true
      },
      // 3. 25W PD
      {
        name: 'WAGH 25W PD Fast Wall Charger',
        slug: 'wagh-25w-pd-fast-wall-charger',
        description: 'Compact 25W USB-C power adapter providing stable and safe fast charging.',
        price: 499,
        mrp: 999,
        images: [
          '/product-images/25w-pd-1.webp',
          '/product-images/25w-pd-2.webp',
          '/product-images/25w-pd-3.webp',
          '/product-images/25w-pd-4.webp'
        ],
        category: catChargers,
        brand: 'WAGH',
        specs: {
          outputPower: '25W Type-C PD',
          compatibility: 'Universal Smart Devices',
          warranty: '6 Months Warranty',
          color: 'Classic White',
          material: 'ABS Alloy'
        },
        stock: 180,
        ratingAvg: 4.7,
        ratingCount: 88,
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: false
      },
      // 4. 80W Super Charger
      {
        name: 'WAGH 80W Super Charger Adapter',
        slug: 'wagh-80w-super-charger-adapter',
        description: 'Ultra-high output 80W super fast charging brick engineered for flagships and laptops.',
        price: 1199,
        mrp: 2299,
        images: [
          '/product-images/80w-super-charger-1.webp',
          '/product-images/80w-super-charger-2.webp',
          '/product-images/80w-super-charger-3.webp',
          '/product-images/80w-super-charger-4.webp'
        ],
        category: catChargers,
        brand: 'WAGH',
        specs: {
          outputPower: '80W Super Flash Charge',
          compatibility: 'Smartphones, Tablets & Laptops',
          warranty: '6 Months Replacement Warranty',
          color: 'Glossy White & Teal Trim',
          material: 'Polycarbonate + Anodized Alloy'
        },
        stock: 90,
        ratingAvg: 4.9,
        ratingCount: 110,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: true
      },
      // 5. 100W Phantom Neo
      {
        name: 'WAGH 100W Phantom Neo GaN Adapter',
        slug: 'wagh-100w-phantom-neo-gan-adapter',
        description: 'Flagship GaN technology delivering 100W total output in a compact desktop-friendly footprint.',
        price: 1999,
        mrp: 3999,
        images: [
          '/product-images/100w-phantom-neo-adopter-1.webp',
          '/product-images/100w-phantom-neo-adopter-2.webp',
          '/product-images/100w-phantom-neo-adopter-3.webp',
          '/product-images/100w-phantom-neo-adopter-4.webp'
        ],
        category: catChargers,
        brand: 'WAGH',
        specs: {
          outputPower: '100W Max GaN Output',
          compatibility: 'MacBook Pro, Laptops, Flagship Phones',
          warranty: '6 Months Replacement Warranty',
          color: 'Cyber Black',
          material: 'GaN III Semiconductor'
        },
        stock: 60,
        ratingAvg: 5.0,
        ratingCount: 64,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: false
      },
      // 6. 66W + 100W All-In-1
      {
        name: 'WAGH 66W + 100W All-In-1 Super Adapter',
        slug: 'wagh-66w-plus-100w-all-in-1-adapter',
        description: 'Versatile multi-port charging solution supporting up to 100W combined power delivery.',
        price: 1599,
        mrp: 2999,
        images: [
          '/product-images/66w-plus-100w-all-in-1-adopter-1.webp',
          '/product-images/66w-plus-100w-all-in-1-adopter-2.webp',
          '/product-images/66w-plus-100w-all-in-1-adopter-3.webp',
          '/product-images/66w-plus-100w-all-in-1-adopter-4.webp'
        ],
        category: catChargers,
        brand: 'WAGH',
        specs: {
          outputPower: '100W Max Multi-Port Output',
          compatibility: 'Multi-device Universal Charging',
          warranty: '6 Months Warranty',
          color: 'Metallic Gray',
          material: 'Fireproof ABS'
        },
        stock: 75,
        ratingAvg: 4.8,
        ratingCount: 52,
        isFeatured: false,
        isNewArrival: true,
        isBestSeller: false
      },
      // 7. Strom 10000mAh Power Bank
      {
        name: 'WAGH Strom 10,000mAh Fast Charge Power Bank',
        slug: 'wagh-strom-10000mah-power-bank',
        description: 'High-density 10,000mAh portable battery pack with dual output and fast charging capability.',
        price: 1199,
        mrp: 2299,
        images: [
          '/product-images/strom-powerbank-1-10000mah.webp',
          '/product-images/strom-powerbank-2-10000mah.webp',
          '/product-images/strom-powerbank-3-10000mah.webp',
          '/product-images/strom-powerbank-4-10000mah.webp'
        ],
        category: catPowerBanks,
        brand: 'WAGH',
        specs: {
          outputPower: '22.5W Fast Charge / 20W PD',
          compatibility: 'Smartphones & Accessories',
          warranty: '6 Months Warranty',
          color: 'Matte Teal',
          material: 'Anti-scratch ABS Shell'
        },
        stock: 110,
        ratingAvg: 4.8,
        ratingCount: 175,
        isFeatured: true,
        isNewArrival: false,
        isBestSeller: true
      },
      // 8. Liner 10000mAh Power Bank
      {
        name: 'WAGH Liner 10,000mAh Sleek Power Bank',
        slug: 'wagh-liner-10000mah-power-bank',
        description: 'Ultra-slim linear design 10,000mAh power bank featuring LED power status indicators.',
        price: 999,
        mrp: 1999,
        images: [
          '/product-images/liner-powerbank-1-10000mah.webp',
          '/product-images/liner-powerbank-2-10000mah.webp',
          '/product-images/liner-powerbank-3-10000mah.webp',
          '/product-images/liner-powerbank-4-10000mah.webp'
        ],
        category: catPowerBanks,
        brand: 'WAGH',
        specs: {
          outputPower: '20W PD Fast Charging',
          compatibility: 'Universal Type-C & USB-A',
          warranty: '6 Months Warranty',
          color: 'Stealth Black',
          material: 'Lightweight Polymer Alloy'
        },
        stock: 130,
        ratingAvg: 4.7,
        ratingCount: 84,
        isFeatured: false,
        isNewArrival: true,
        isBestSeller: false
      },
      // 9. Mini 10000mAh Power Bank
      {
        name: 'WAGH Mini 10,000mAh Compact Power Bank',
        slug: 'wagh-mini-10000mah-power-bank',
        description: 'Pocket-sized ultra-compact power bank designed for total portability without compromising power.',
        price: 899,
        mrp: 1799,
        images: [
          '/product-images/mini-powerbank-1-black.webp',
          '/product-images/mini-powerbank-2-black.webp',
          '/product-images/mini-powerbank-3-black.webp',
          '/product-images/mini-powerbank-4-black.webp'
        ],
        category: catPowerBanks,
        brand: 'WAGH',
        specs: {
          outputPower: '22.5W Quick Charge',
          compatibility: 'Smartphones & Wearables',
          warranty: '6 Months Warranty',
          color: 'Deep Black',
          material: 'Textured Rubberized Polycarbonate'
        },
        stock: 140,
        ratingAvg: 4.8,
        ratingCount: 96,
        isFeatured: true,
        isNewArrival: false,
        isBestSeller: true
      },
      // 10. Big 20000mAh Power Bank
      {
        name: 'WAGH Big 20,000mAh Heavy-Duty Power Bank',
        slug: 'wagh-big-20000mah-power-bank',
        description: 'Massive 20,000mAh capacity backup battery built to power laptops and phones for multiple days.',
        price: 1499,
        mrp: 2999,
        images: [
          '/product-images/big-powerbank-1-black.webp',
          '/product-images/big-powerbank-2-black.webp',
          '/product-images/big-powerbank-3-black.webp',
          '/product-images/big-powerbank-4-black.webp'
        ],
        category: catPowerBanks,
        brand: 'WAGH',
        specs: {
          outputPower: '22.5W Super Charge + 20W PD',
          compatibility: 'Laptops, Tablets & Smartphones',
          warranty: '6 Months Replacement Warranty',
          color: 'Matte Black',
          material: 'Heavy-Duty ABS Enclosure'
        },
        stock: 95,
        ratingAvg: 4.9,
        ratingCount: 210,
        isFeatured: true,
        isNewArrival: false,
        isBestSeller: true
      },
      // 11. 120W Red Cable C to C
      {
        name: 'WAGH 120W Red Cable (Type-C to Type-C)',
        slug: 'wagh-120w-red-cable-c-to-c',
        description: 'Heavy-duty 120W max power delivery Type-C cable with signature red braided jacket.',
        price: 399,
        mrp: 799,
        images: [
          '/product-images/120w-red-cable-c-to-c-1.webp',
          '/product-images/120w-red-cable-c-to-c-2.webp',
          '/product-images/120w-red-cable-c-to-c-3.webp',
          '/product-images/120w-red-cable-c-to-c-4.webp'
        ],
        category: catCables,
        brand: 'WAGH',
        specs: {
          outputPower: '120W 6A Max Power Delivery',
          cableLength: '1.2 Meters',
          compatibility: 'Type-C Laptops, Tablets, Phones',
          warranty: '6 Months Warranty',
          color: 'Signature Red Braided',
          material: 'Reinforced Nylon Weave'
        },
        stock: 250,
        ratingAvg: 4.9,
        ratingCount: 160,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: true
      },
      // 12. 120W Red Cable USB to C
      {
        name: 'WAGH 120W Red Cable (USB to Type-C)',
        slug: 'wagh-120w-red-cable-usb-to-c',
        description: 'Ultra-durable 120W fast charging cable connecting standard USB-A to Type-C devices.',
        price: 349,
        mrp: 699,
        images: [
          '/product-images/120w-red-cable-usb-to-c-1.webp',
          '/product-images/120w-red-cable-usb-to-c-2.webp',
          '/product-images/120w-red-cable-usb-to-c-3.webp',
          '/product-images/120w-red-cable-usb-to-c-4.webp'
        ],
        category: catCables,
        brand: 'WAGH',
        specs: {
          outputPower: '120W Super Charge',
          cableLength: '1.2 Meters',
          compatibility: 'USB-A to Type-C Smart Devices',
          warranty: '6 Months Warranty',
          color: 'Signature Red Braided',
          material: 'Tangle-Free Braided Nylon'
        },
        stock: 200,
        ratingAvg: 4.8,
        ratingCount: 135,
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: true
      },
      // 13. GRIPP Cable C to C
      {
        name: 'WAGH GRIPP Heavy Duty Cable (Type-C to Type-C)',
        slug: 'wagh-gripp-cable-c-to-c',
        description: 'Tough strain-relief cable with ergonomic grip housing for long-lasting high-wattage charging.',
        price: 449,
        mrp: 899,
        images: [
          '/product-images/gripp-c-to-type-c-1-black.webp',
          '/product-images/gripp-c-to-type-c-2-black.webp',
          '/product-images/gripp-c-to-type-c-3-black.webp',
          '/product-images/gripp-c-to-type-c-4-black.webp',
          '/product-images/gripp-c-to-type-c-1-white.webp',
          '/product-images/gripp-c-to-type-c-2-white.webp',
          '/product-images/gripp-c-to-type-c-3-white.webp',
          '/product-images/gripp-c-to-type-c-4-white.webp'
        ],
        category: catCables,
        brand: 'WAGH',
        specs: {
          outputPower: '100W PD Power Delivery',
          cableLength: '1.5 Meters',
          compatibility: 'Type-C Laptops & Phones',
          warranty: '6 Months Warranty',
          color: 'Black & White Variants',
          material: 'Textured Grip TPU + Braided Core'
        },
        stock: 190,
        ratingAvg: 4.9,
        ratingCount: 145,
        isFeatured: true,
        isNewArrival: false,
        isBestSeller: false
      },
      // 14. GRIPP Cable USB to C
      {
        name: 'WAGH GRIPP Fast Charge Cable (USB to Type-C)',
        slug: 'wagh-gripp-cable-usb-to-c',
        description: 'Reinforced USB to Type-C fast charging cable featuring protective molded ends.',
        price: 399,
        mrp: 799,
        images: [
          '/product-images/gripp-usb-to-type-c-1-black.webp',
          '/product-images/gripp-usb-to-type-c-2-black.webp',
          '/product-images/gripp-usb-to-type-c-3-black.webp',
          '/product-images/gripp-usb-to-type-c-4-black.webp',
          '/product-images/gripp-usb-to-type-c-1-white.webp',
          '/product-images/gripp-usb-to-type-c-2-white.webp',
          '/product-images/gripp-usb-to-type-c-3-white.webp',
          '/product-images/gripp-usb-to-type-c-4-white.webp'
        ],
        category: catCables,
        brand: 'WAGH',
        specs: {
          outputPower: '65W Max Charge',
          cableLength: '1.2 Meters',
          compatibility: 'USB-A to Type-C Smart Devices',
          warranty: '6 Months Warranty',
          color: 'Black & White Variants',
          material: 'Flexible TPU Shielding'
        },
        stock: 210,
        ratingAvg: 4.7,
        ratingCount: 110,
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: false
      },
      // 15. Hunter 1M USB to C
      {
        name: 'WAGH Hunter Series 1M Cable (USB to Type-C)',
        slug: 'wagh-hunter-1m-usb-to-c',
        description: 'Sleek 1-meter charging cable engineered for everyday quick charging and reliable data transfer.',
        price: 299,
        mrp: 599,
        images: [
          '/product-images/hunter-1m-type-usb-to-c-1.webp',
          '/product-images/hunter-1m-type-usb-to-c-2.webp',
          '/product-images/hunter-1m-type-usb-to-c-3.webp',
          '/product-images/hunter-1m-type-usb-to-c-4.webp'
        ],
        category: catCables,
        brand: 'WAGH',
        specs: {
          outputPower: '3.1A Fast Charging',
          cableLength: '1.0 Meter',
          compatibility: 'Type-C Android Devices',
          warranty: '6 Months Warranty',
          color: 'Matte Black',
          material: 'High-Density PVC'
        },
        stock: 300,
        ratingAvg: 4.8,
        ratingCount: 220,
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: true
      },
      // 16. Hunter 1M USB to Lightning
      {
        name: 'WAGH Hunter Series 1M Cable (USB to Lightning)',
        slug: 'wagh-hunter-1m-usb-to-lightning',
        description: 'Certified USB to Lightning cable providing steady power delivery for iPhones and iPads.',
        price: 349,
        mrp: 699,
        images: [
          '/product-images/hunter-1m-type-usb-to-l-1.webp',
          '/product-images/hunter-1m-type-usb-to-l-2.webp',
          '/product-images/hunter-1m-type-usb-to-l-3.webp',
          '/product-images/hunter-1m-type-usb-to-l-4.webp'
        ],
        category: catCables,
        brand: 'WAGH',
        specs: {
          outputPower: '2.4A iPhone Fast Charge',
          cableLength: '1.0 Meter',
          compatibility: 'iPhone, iPad & AirPods',
          warranty: '6 Months Warranty',
          color: 'Classic Black',
          material: 'Reinforced Strain Relief'
        },
        stock: 220,
        ratingAvg: 4.8,
        ratingCount: 140,
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: false
      },
      // 17. Hunter 1M USB to Micro
      {
        name: 'WAGH Hunter Series 1M Cable (USB to Micro)',
        slug: 'wagh-hunter-1m-usb-to-micro',
        description: 'Durable Micro-USB charging cable for legacy accessories, power banks, and speakers.',
        price: 249,
        mrp: 499,
        images: [
          '/product-images/hunter-1m-type-usb-to-micro-1.webp',
          '/product-images/hunter-1m-type-usb-to-micro-2.webp',
          '/product-images/hunter-1m-type-usb-to-micro-3.webp',
          '/product-images/hunter-1m-type-usb-to-micro-4.webp'
        ],
        category: catCables,
        brand: 'WAGH',
        specs: {
          outputPower: '2.4A Micro Charging',
          cableLength: '1.0 Meter',
          compatibility: 'Micro-USB Devices',
          warranty: '6 Months Warranty',
          color: 'Stealth Black',
          material: 'PVC Shielding'
        },
        stock: 180,
        ratingAvg: 4.6,
        ratingCount: 75,
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: false
      },
      // 18. Hunter 2M C to C
      {
        name: 'WAGH Hunter Series 2M Extra Long Cable (Type-C to Type-C)',
        slug: 'wagh-hunter-2m-c-to-c',
        description: 'Extra-long 2-meter Type-C to Type-C cable giving freedom to charge comfortably anywhere.',
        price: 449,
        mrp: 899,
        images: [
          '/product-images/hunter-2m-type-c-to-c-1.webp',
          '/product-images/hunter-2m-type-c-to-c-2.webp',
          '/product-images/hunter-2m-type-c-to-c-3.webp',
          '/product-images/hunter-2m-type-c-to-c-4.webp'
        ],
        category: catCables,
        brand: 'WAGH',
        specs: {
          outputPower: '60W Power Delivery',
          cableLength: '2.0 Meters (6.6 Feet)',
          compatibility: 'Type-C Laptops, Tablets & Phones',
          warranty: '6 Months Warranty',
          color: 'Black',
          material: 'Heavy-Duty Braided Nylon'
        },
        stock: 160,
        ratingAvg: 4.9,
        ratingCount: 115,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: false
      },
      // 19. Hunter 2M C to Lightning
      {
        name: 'WAGH Hunter Series 2M Extra Long Cable (Type-C to Lightning)',
        slug: 'wagh-hunter-2m-c-to-lightning',
        description: 'Extended 2-meter Type-C to Lightning cable supporting fast iPhone PD charging over distance.',
        price: 499,
        mrp: 999,
        images: [
          '/product-images/hunter-2m-type-c-to-l-1.webp',
          '/product-images/hunter-2m-type-c-to-l-2.webp',
          '/product-images/hunter-2m-type-c-to-l-3.webp',
          '/product-images/hunter-2m-type-c-to-l-4.webp'
        ],
        category: catCables,
        brand: 'WAGH',
        specs: {
          outputPower: '27W Max iPhone PD',
          cableLength: '2.0 Meters (6.6 Feet)',
          compatibility: 'iPhone & iPad Series',
          warranty: '6 Months Warranty',
          color: 'Black',
          material: 'Braided Nylon'
        },
        stock: 140,
        ratingAvg: 4.9,
        ratingCount: 98,
        isFeatured: false,
        isNewArrival: true,
        isBestSeller: false
      },
      // 20. Rootz C to C
      {
        name: 'WAGH Rootz Series Cable (Type-C to Type-C)',
        slug: 'wagh-rootz-c-to-c',
        description: 'Minimalist clean aesthetic cable engineered for optimal power transfer and safety.',
        price: 349,
        mrp: 699,
        images: [
          '/product-images/rootz-type-c-to-c-1.webp',
          '/product-images/rootz-type-c-to-c-2.webp',
          '/product-images/rootz-type-c-to-c-3.webp',
          '/product-images/rootz-type-c-to-c-4.webp'
        ],
        category: catCables,
        brand: 'WAGH',
        specs: {
          outputPower: '60W PD Charge',
          cableLength: '1.2 Meters',
          compatibility: 'Type-C Smart Devices',
          warranty: '6 Months Warranty',
          color: 'Teal & White',
          material: 'TPE Soft Finish'
        },
        stock: 175,
        ratingAvg: 4.7,
        ratingCount: 82,
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: false
      },
      // 21. Rootz C to Lightning
      {
        name: 'WAGH Rootz Series Cable (Type-C to Lightning)',
        slug: 'wagh-rootz-c-to-lightning',
        description: 'Elegant Type-C to Lightning cable providing fast charging for Apple smartphones.',
        price: 399,
        mrp: 799,
        images: [
          '/product-images/rootz-type-c-to-l-1.webp',
          '/product-images/rootz-type-c-to-l-2.webp',
          '/product-images/rootz-type-c-to-l-3.webp',
          '/product-images/rootz-type-c-to-l-4.webp'
        ],
        category: catCables,
        brand: 'WAGH',
        specs: {
          outputPower: '27W Fast PD',
          cableLength: '1.2 Meters',
          compatibility: 'iPhone & iOS Devices',
          warranty: '6 Months Warranty',
          color: 'Teal & White',
          material: 'Soft Polymer Outer'
        },
        stock: 150,
        ratingAvg: 4.8,
        ratingCount: 79,
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: false
      },
      // 22. Bullet Z2 Neckband
      {
        name: 'WAGH Bullet Z2 Wireless Bluetooth Neckband',
        slug: 'wagh-bullet-z2-wireless-neckband',
        description: 'Flexible ergonomic neckband with magnetic earbuds, dynamic titanium drivers, and fast charge (10 min = 10 hrs). Available in Black, Green, and Red options.',
        price: 699,
        mrp: 1499,
        images: [
          '/product-images/bullet-z2-neckband-1-black.webp',
          '/product-images/bullet-z2-neckband-2-black.webp',
          '/product-images/bullet-z2-neckband-3-black.webp',
          '/product-images/bullet-z2-neckband-4-black.webp',
          '/product-images/bullet-z2-neckband-1-green.webp',
          '/product-images/bullet-z2-neckband-2-green.webp',
          '/product-images/bullet-z2-neckband-3-green.webp',
          '/product-images/bullet-z2-neckband-4-green.webp',
          '/product-images/bullet-z2-neckband-1-red.webp',
          '/product-images/bullet-z2-neckband-2-red.webp',
          '/product-images/bullet-z2-neckband-3-red.webp',
          '/product-images/bullet-z2-neckband-4-red.webp'
        ],
        category: catAudio,
        brand: 'WAGH',
        specs: {
          outputPower: '13mm Drivers / ENC Call Mic',
          batteryLife: '30 Hours Playback',
          compatibility: 'Bluetooth v5.2 Dual Pairing',
          warranty: '6 Months Warranty',
          color: 'Black, Green, Red',
          material: 'Liquid Silicone Neckband'
        },
        stock: 200,
        ratingAvg: 4.8,
        ratingCount: 195,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: true
      },
      // 23. PowerBuds TWS
      {
        name: 'WAGH PowerBuds True Wireless Stereo Earbuds',
        slug: 'wagh-powerbuds-tws-earbuds',
        description: 'Premium TWS earbuds featuring crystal-clear acoustics, low latency gaming mode, and 30-hour total battery life with wireless charging case.',
        price: 1299,
        mrp: 2499,
        images: [
          '/product-images/powerbuds-1.webp',
          '/product-images/powerbuds-2.webp',
          '/product-images/powerbuds-3.webp',
          '/product-images/powerbuds-4.webp'
        ],
        category: catAudio,
        brand: 'WAGH',
        specs: {
          outputPower: '10mm Graphene Drivers + ENC',
          batteryLife: '30 Hours Total Playtime',
          compatibility: 'Bluetooth 5.3 Universal',
          warranty: '6 Months Replacement Warranty',
          color: 'Metallic Teal & Glass Case',
          material: 'IPX5 Sweatproof Earbuds'
        },
        stock: 120,
        ratingAvg: 4.9,
        ratingCount: 184,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: true
      }
    ];

    const createdProducts = await Product.insertMany(productsData);
    console.log(`⚡ Seeded ${createdProducts.length} Official WAGH Products mapped to local static assets.`);

    // Seed Sample Product Reviews
    const sampleProduct = createdProducts[0]; // 45W Charger
    await Review.create([
      {
        product: sampleProduct._id,
        user: demoCustomer._id,
        userName: demoCustomer.name,
        rating: 5,
        comment: 'Blown away by the build quality and charging speed! Charged my S23 Ultra super fast. Solid finish looks incredibly premium.',
        verifiedPurchase: true
      },
      {
        product: sampleProduct._id,
        user: adminUser._id,
        userName: 'Aarav Sharma',
        rating: 5,
        comment: 'The charger is super sturdy and doesn’t heat up at all while charging. Best price for mobile accessories!',
        verifiedPurchase: true
      }
    ]);

    console.log('⭐ Seeded product reviews.');
    console.log('✅ WAGH Database Seed Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();
