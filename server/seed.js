const mongoose = require('mongoose');
require('dotenv').config();

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

    // Seed Products
    const productsData = [
      {
        name: 'WAGH Super Fast Charger 2.0 45W',
        slug: 'wagh-super-fast-charger-45w',
        description: 'Engineered for maximum power in a sleek, ultra-compact body. Features Super Fast Charging 2.0 protocol (PPS 45W) capable of boosting compatible phones up to 65% charge in just 25 minutes. Built with aerospace-grade thermal dissipation and 10-layer safety protection system.',
        price: 749,
        mrp: 1499,
        images: [
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80'
        ],
        category: catChargers,
        brand: 'WAGH',
        specs: {
          outputPower: '45W Max PPS / PD 3.0',
          compatibility: 'Universal (Samsung SFC 2.0, iPhone 15/14, iPad, Mac, Pixel)',
          cableLength: '1.2m Braided Type-C Included',
          dimensions: '5.2 × 4.8 × 2.8 cm',
          size: 'Height: 5.2 cm | Width: 4.8 cm',
          height: '5.2 cm',
          width: '4.8 cm',
          warranty: '24 Months Replacement Warranty',
          color: 'Premium Deep Teal & Matte Gold',
          material: 'Fireproof PC + Anodized Aluminum Rim'
        },
        stock: 150,
        ratingAvg: 4.9,
        ratingCount: 142,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: true
      },
      {
        name: 'WAGH GaN Power Duo 65W Dual Wall Charger',
        slug: 'wagh-gan-power-duo-65w',
        description: 'Next-generation Gallium Nitride (GaN III) technology allows dual high-speed charging for laptops and smartphones simultaneously. Extremely lightweight design with foldable AC pins.',
        price: 1299,
        mrp: 2499,
        images: [
          'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'
        ],
        category: catChargers,
        brand: 'WAGH',
        specs: {
          outputPower: '65W Total (USB-C 65W + USB-A 18W)',
          compatibility: 'MacBook Air/Pro, iPhone, Android, Steam Deck',
          dimensions: '6.5 × 5.0 × 3.0 cm',
          size: 'Height: 6.5 cm | Width: 5.0 cm',
          height: '6.5 cm',
          width: '5.0 cm',
          warranty: '24 Months Warranty',
          color: 'Stealth Black',
          material: 'Gallium Nitride III Semiconductor'
        },
        stock: 80,
        ratingAvg: 4.8,
        ratingCount: 88,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: false
      },
      {
        name: 'WAGH TitanPower 20,000mAh 22.5W Power Bank',
        slug: 'wagh-titanpower-20000mah-power-bank',
        description: 'Monstrous 20,000mAh Li-Polymer battery capacity capable of powering an average smartphone up to 4.5 times. Equipped with real-time LED digital percentage display and triple output ports.',
        price: 1499,
        mrp: 2999,
        images: [
          'https://images.unsplash.com/photo-1609592424074-67d7162629b3?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80'
        ],
        category: catPowerBanks,
        brand: 'WAGH',
        specs: {
          outputPower: '22.5W Fast Charge / 20W PD Type-C',
          compatibility: 'Universal USB-A & USB-C Devices',
          dimensions: '14.8 × 6.8 × 2.6 cm',
          size: 'Height: 14.8 cm | Width: 6.8 cm',
          height: '14.8 cm',
          width: '6.8 cm',
          warranty: '12 Months Warranty',
          color: 'Deep Teal Metal Finish',
          material: 'Textured Anti-scratch ABS Alloy'
        },
        stock: 110,
        ratingAvg: 4.7,
        ratingCount: 210,
        isFeatured: true,
        isNewArrival: false,
        isBestSeller: true
      },
      {
        name: 'WAGH Magnetic MagSafe 10,000mAh Wireless Power Bank',
        slug: 'wagh-magsafe-10000mah-power-bank',
        description: 'Snap & Charge wirelessly with ultra-strong N52 neodymium magnetic lock. Supports 15W wireless fast charging and 20W PD wired pass-through charging with a metallic ring stand.',
        price: 1199,
        mrp: 2299,
        images: [
          'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1609592424074-67d7162629b3?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'
        ],
        category: catPowerBanks,
        brand: 'WAGH',
        specs: {
          outputPower: '15W MagSafe Wireless / 20W Type-C PD',
          compatibility: 'iPhone 12/13/14/15/16 Series & Qi Android',
          dimensions: '10.2 × 6.5 × 1.8 cm',
          size: 'Height: 10.2 cm | Width: 6.5 cm',
          height: '10.2 cm',
          width: '6.5 cm',
          warranty: '12 Months Warranty',
          color: 'Titanium Grey & Deep Teal',
          material: 'Soft-Touch Matte Silicone & Aluminum Stand'
        },
        stock: 65,
        ratingAvg: 4.9,
        ratingCount: 76,
        isFeatured: false,
        isNewArrival: true,
        isBestSeller: true
      },
      {
        name: 'WAGH ArmorFlex Braided Type-C to Type-C 100W Cable (1.5m)',
        slug: 'wagh-armorflex-100w-type-c-cable',
        description: 'Indestructible double-braided nylon sleeve tested to withstand 30,000+ bends. Built-in E-Marker smart chip guarantees safe 100W Power Delivery and high-speed 480Mbps data transfer.',
        price: 399,
        mrp: 799,
        images: [
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1609592424074-67d7162629b3?w=800&auto=format&fit=crop&q=80'
        ],
        category: catCables,
        brand: 'WAGH',
        specs: {
          outputPower: '100W 5A Max Power Delivery',
          cableLength: '1.5 Meters (5 Feet)',
          compatibility: 'Type-C Laptops, Tablets, Smartphones',
          dimensions: '150 × 0.5 × 0.5 cm',
          size: 'Length: 150 cm | Width: 0.5 cm',
          height: '150 cm',
          width: '0.5 cm',
          warranty: '24 Months Replacement Warranty',
          color: 'Deep Teal Braided Weave',
          material: 'Kevlar Reinforced Nylon Fiber'
        },
        stock: 300,
        ratingAvg: 4.8,
        ratingCount: 310,
        isFeatured: true,
        isNewArrival: false,
        isBestSeller: true
      },
      {
        name: 'WAGH MFi Braided Lightning to USB-C Cable (1.2m)',
        slug: 'wagh-lightning-to-usb-c-cable',
        description: 'Apple MFi Certified fast charging cable designed to charge iPhones from 0 to 50% in 30 minutes when paired with a WAGH PD charger. Strain-relief joint architecture prevents fraying.',
        price: 449,
        mrp: 899,
        images: [
          'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80'
        ],
        category: catCables,
        brand: 'WAGH',
        specs: {
          outputPower: '27W Max iPhone PD Fast Charge',
          cableLength: '1.2 Meters',
          compatibility: 'iPhone 14/13/12/11, iPad, AirPods',
          dimensions: '120 × 0.4 × 0.4 cm',
          size: 'Length: 120 cm | Width: 0.4 cm',
          height: '120 cm',
          width: '0.4 cm',
          warranty: '24 Months Warranty',
          color: 'Off-White & Amber Gold Connectors',
          material: 'Braided Nylon + Zinc Alloy Shell'
        },
        stock: 200,
        ratingAvg: 4.9,
        ratingCount: 165,
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: false
      },
      {
        name: 'WAGH Acoustic Pro TWS Active Noise Cancelling Earbuds',
        slug: 'wagh-acoustic-pro-tws-earbuds',
        description: 'Immerse yourself in rich, audiophile-grade sound with 32dB Active Noise Cancellation and 10mm Graphene Drivers. Enjoy up to 40 hours of playtime with the wireless charging case and quad MIC clear calls.',
        price: 1799,
        mrp: 3499,
        images: [
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
        ],
        category: catAudio,
        brand: 'WAGH',
        specs: {
          outputPower: '32dB Hybrid ANC + ENC Quad Mic',
          compatibility: 'Bluetooth 5.3 Universal (iOS & Android)',
          batteryLife: '40 Hours Total with Charging Case',
          dimensions: '6.0 × 4.8 × 2.4 cm',
          size: 'Height: 6.0 cm | Width: 4.8 cm',
          height: '6.0 cm',
          width: '4.8 cm',
          warranty: '12 Months Replacement Warranty',
          color: 'Teal Green Glass Metallic Case',
          material: 'Ergonomic IPX5 Sweatproof Silicone'
        },
        stock: 95,
        ratingAvg: 4.9,
        ratingCount: 184,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: true
      },
      {
        name: 'WAGH BassWave 30H Wireless Bluetooth Neckband',
        slug: 'wagh-basswave-wireless-neckband',
        description: 'Ultra-flexible silicone neckband with magnetic earbuds and 13mm dynamic titanium drivers for deep, thumping bass. Features ASAP Charge technology (10 min charge = 10 hrs playtime).',
        price: 699,
        mrp: 1499,
        images: [
          'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&auto=format&fit=crop&q=80'
        ],
        category: catAudio,
        brand: 'WAGH',
        specs: {
          outputPower: '13mm Titanium Drivers / ENC',
          batteryLife: '30 Hours Playback / ASAP Fast Charge',
          compatibility: 'Bluetooth v5.2 Dual Pairing',
          dimensions: '18.0 × 14.0 × 1.2 cm',
          size: 'Height: 18.0 cm | Width: 14.0 cm',
          height: '18.0 cm',
          width: '14.0 cm',
          warranty: '12 Months Warranty',
          color: 'Matte Teal & Midnight Black',
          material: 'Liquid Silicone Neckband'
        },
        stock: 140,
        ratingAvg: 4.6,
        ratingCount: 92,
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: false
      },
      {
        name: 'WAGH 3-in-1 Foldable Wireless Charging Station 15W',
        slug: 'wagh-3-in-1-wireless-charging-stand',
        description: 'Declutter your nightstand with a single ultra-sleek charging hub for your iPhone, Apple Watch, and AirPods simultaneously. Folds completely flat for travel.',
        price: 1999,
        mrp: 3999,
        images: [
          'https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1609592424074-67d7162629b3?w=800&auto=format&fit=crop&q=80'
        ],
        category: catChargers,
        brand: 'WAGH',
        specs: {
          outputPower: '15W Phone + 5W AirPods + 3W Watch',
          compatibility: 'Qi-enabled phones, Apple Watch, AirPods',
          warranty: '12 Months Warranty',
          color: 'Metallic Teal & Frosted Glass',
          material: 'CNC Aluminum Base + Soft Rubber Pads'
        },
        stock: 50,
        ratingAvg: 4.9,
        ratingCount: 53,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: false
      }
    ];

    const createdProducts = await Product.insertMany(productsData);
    console.log(`⚡ Seeded ${createdProducts.length} Premium WAGH Products.`);

    // Seed Sample Product Reviews
    const sampleProduct = createdProducts[0]; // Super Fast Charger 45W
    await Review.create([
      {
        product: sampleProduct._id,
        user: demoCustomer._id,
        userName: demoCustomer.name,
        rating: 5,
        comment: 'Blown away by the build quality and charging speed! Charged my Samsung S23 Ultra from 10% to 70% in under 25 minutes. Solid teal finish looks incredibly premium.',
        verifiedPurchase: true
      },
      {
        product: sampleProduct._id,
        user: adminUser._id,
        userName: 'Aarav Sharma',
        rating: 5,
        comment: 'The braided cable included in the box is super thick and sturdy. Doesn’t heat up at all while charging. Best ₹749 spent on mobile accessories!',
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
