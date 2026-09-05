// One-off local-only seeder: adds 2 real products per category (Buds, Power
// Banks, Wall Chargers, Cables, Neckbands) sourced from the WAGH product
// catalogs (xlsx files) and real photos in /photos-product at the repo root.
// Idempotent — re-running skips any product whose slug already exists.
//
// Usage: node scripts/addLocalCatalogProducts.js
// Always runs against MONGODB_URI from server/.env (local dev DB).

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

const MONGODB_URI = process.env.MONGODB_URI;
const PHOTOS_ROOT = path.join(__dirname, '../../photos-product');
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Copies real product photos into server/public/uploads and returns the
// "/uploads/<file>" paths the Product model expects.
function copyImages(slug, sourceFiles) {
  return sourceFiles.map((relPath, i) => {
    const src = path.join(PHOTOS_ROOT, relPath);
    const ext = path.extname(src) || '.webp';
    const filename = `${slug}-${i + 1}${ext}`;
    const dest = path.join(UPLOADS_DIR, filename);
    fs.copyFileSync(src, dest);
    return `/uploads/${filename}`;
  });
}

const CATEGORIES = [
  { name: 'Buds', slug: 'buds', description: 'True wireless earbuds with ENC, low-latency gaming mode, and long battery backup.', icon: 'Headphones' },
  { name: 'Power Banks', slug: 'power-banks', description: 'High-capacity, fast-charging portable power banks.', icon: 'BatteryCharging' },
  { name: 'Wall Chargers', slug: 'wall-chargers', description: 'GaN and PD wall adapters for fast, safe charging.', icon: 'Zap' },
  { name: 'Cables', slug: 'cables', description: 'Braided, pure-copper fast-charging data cables.', icon: 'Cable' },
  { name: 'Neckbands', slug: 'neckbands', description: 'Bluetooth neckbands with ENC and long playtime.', icon: 'Headphones' },
];

// Real catalog data pulled from the provided xlsx files + matching photos in
// /photos-product. Prices/MRP are the catalog's "Price / Selling Price" and
// "MRP" columns, except where noted — the neckband catalog left those columns
// blank, so those two prices are estimates rather than sourced values.
const PRODUCTS = [
  // --- Buds -------------------------------------------------------------
  {
    categorySlug: 'buds',
    name: 'WAGH® Power Buds True Wireless Earbuds',
    brand: 'WAGH',
    price: 1999,
    mrp: 1999,
    description: 'True wireless earbuds with Bluetooth V5.4, 300H standby, HD calls, ultra-low-latency game mode, and Type-C charging.',
    specs: { outputPower: 'DC 5V / 320mA', compatibility: 'Universal (iOS & Android)', warranty: '6 Months', color: 'Black' },
    sourceImages: ['Buds/PowerBuds 1 - Hanuman Mobile.webp', 'Buds/PowerBuds 2 - Hanuman Mobile.webp', 'Buds/PowerBuds 3 - Hanuman Mobile.webp', 'Buds/PowerBuds 4 - Hanuman Mobile.webp'],
    sections: [{
      title: 'Key Features', type: 'list', order: 0,
      items: [
        { label: '', value: 'Bluetooth V5.4 Smart Chip', order: 0 },
        { label: '', value: 'Up to 300 Hours Standby Time', order: 1 },
        { label: '', value: 'HD Call Quality & Inductive Touch Sensor', order: 2 },
        { label: '', value: 'Ultra Low Latency Game Mode', order: 3 },
        { label: '', value: 'Music Playtime: 4.5 Hours | Talk Time: 4 Hours', order: 4 },
        { label: '', value: 'BIS Certified (IS 60065:2014, R-41201286)', order: 5 },
      ],
    }],
  },
  {
    categorySlug: 'buds',
    name: 'WAGH® Cool Buds True Wireless Earbuds',
    brand: 'WAGH',
    price: 1999,
    mrp: 1999,
    description: 'True wireless earbuds with 10mm heavy bass drivers, 45H music playtime, and full touch control.',
    specs: { outputPower: 'DC 5V / 320mA', compatibility: 'Universal (iOS & Android)', warranty: '6 Months', color: 'Black' },
    sourceImages: ['Buds/Cool Buds/Cool Buds 1 - Wagh M..webp', 'Buds/Cool Buds/Cool Buds 2 - Wagh M..webp', 'Buds/Cool Buds/Cool Buds 3 - Wagh M..webp', 'Buds/Cool Buds/Cool Buds 4 - Wagh M..webp'],
    sections: [{
      title: 'Key Features', type: 'list', order: 0,
      items: [
        { label: '', value: '10mm Full Range Heavy Bass Drivers', order: 0 },
        { label: '', value: 'Ultra Low Latency Gaming Mode (up to 40ms)', order: 1 },
        { label: '', value: 'Battery Playtime: 45 Hours Music | 12 Hours Talk', order: 2 },
        { label: '', value: '300 Hours Standby Time', order: 3 },
        { label: '', value: 'Full Touch Control & Selfie Function', order: 4 },
      ],
    }],
  },

  // --- Power Banks --------------------------------------------------------
  {
    categorySlug: 'power-banks',
    name: 'WAGH® Mini Powerbank (25W PD + QC, Built-in Cables)',
    brand: 'WAGH',
    price: 2999,
    mrp: 2999,
    description: '10000mAh power bank with 25W PD + QC fast charging and built-in Type-C and Lightning cables — no separate cable needed.',
    specs: { outputPower: '25W Max (PD + QC 3.0)', compatibility: 'iOS (Lightning) & Android/Type-C', warranty: '6 Months', color: 'White' },
    sourceImages: ['powerbanks/Mini_PowerBank/White/Mini PowerBank 1 - White - Wagh M..webp', 'powerbanks/Mini_PowerBank/White/Mini PowerBank 2 - White - Wagh M..webp', 'powerbanks/Mini_PowerBank/White/Mini PowerBank 3 - White - Wagh M..webp', 'powerbanks/Mini_PowerBank/White/Mini PowerBank 4 - White - Wagh M..webp'],
    sections: [{
      title: 'Key Features', type: 'list', order: 0,
      items: [
        { label: '', value: '25W PD + QC Fast Charging', order: 0 },
        { label: '', value: 'Built-in Type-C and Lightning Cables', order: 1 },
        { label: '', value: 'LED Digital Percentage Display', order: 2 },
        { label: '', value: 'BIS Certified (IS 13252 Part 1:2010, R-72006432)', order: 3 },
      ],
    }],
  },
  {
    categorySlug: 'power-banks',
    name: 'WAGH® STORM 25W PD + QC Powerbank',
    brand: 'WAGH',
    price: 1999,
    mrp: 1999,
    description: '10000mAh power bank with 25W PD + QC fast charging, digital battery display, and multi-layer safety protection. Includes extra Type-C cable.',
    specs: { outputPower: '25W Max (PD 3.0 + QC 3.0)', compatibility: 'Universal (Micro, Type-C, PD)', warranty: '6 Months', color: 'Black' },
    sourceImages: ['powerbanks/Strom/Strom Powerbank 1 - 10000mah - Hanuman Mobile.webp', 'powerbanks/Strom/Strom Powerbank 2 - 10000mah - Hanuman Mobile.webp', 'powerbanks/Strom/Strom Powerbank 3 - 10000mah - Hanuman Mobile.webp', 'powerbanks/Strom/Strom Powerbank 4 - 10000mah - Hanuman Mobile.webp'],
    sections: [{
      title: 'Key Features', type: 'list', order: 0,
      items: [
        { label: '', value: '25W PD + QC Fast Charging', order: 0 },
        { label: '', value: 'Digital Battery Percentage Display', order: 1 },
        { label: '', value: 'Surge, Short-Circuit & Temperature Protection', order: 2 },
        { label: '', value: 'Includes Extra Type-C Cable', order: 3 },
      ],
    }],
  },

  // --- Wall Chargers -------------------------------------------------------
  {
    categorySlug: 'wall-chargers',
    name: 'WAGH® Phantom Neo 100W All-in-One Charger',
    brand: 'WAGH',
    price: 1599,
    mrp: 1599,
    description: '100W max smart fast charger with Super Dart, Dart, Warp, VOOC, Fast & Turbo protocol support, includes a fast Type-C cable.',
    specs: { outputPower: '100W Max', compatibility: 'Universal (Multi-Protocol)', warranty: '6 Months', color: 'White' },
    sourceImages: ['Adapters/100W Phantom Neo Adopter 1/100W Phantom Neo Adopter 1 - Hanuman Mobile.webp', 'Adapters/100W Phantom Neo Adopter 1/100W Phantom Neo Adopter 2 - Hanuman Mobile.webp', 'Adapters/100W Phantom Neo Adopter 1/100W Phantom Neo Adopter 3 - Hanuman Mobile.webp', 'Adapters/100W Phantom Neo Adopter 1/100W Phantom Neo Adopter 4 - Hanuman Mobile.webp'],
    sections: [{
      title: 'Key Features', type: 'list', order: 0,
      items: [
        { label: '', value: '100W Max Smart Fast Charge', order: 0 },
        { label: '', value: 'Super Dart / Dart / Warp / VOOC / Fast / Turbo Support', order: 1 },
        { label: '', value: 'Includes Fast Type-C Cable', order: 2 },
        { label: '', value: 'Surge, Short-Circuit & Temperature Protection', order: 3 },
      ],
    }],
  },
  {
    categorySlug: 'wall-chargers',
    name: 'WAGH® Adaptx Dual USB 3.1A Cable-Free Wall Adapter',
    brand: 'WAGH',
    price: 799,
    mrp: 799,
    description: 'Cable-free dual USB-A wall adapter delivering 3.1A fast charging with full multi-protection, BIS certified.',
    specs: { outputPower: 'DC 5.0V / 3.1A', compatibility: 'Type-C, Lightning, Micro (any phone)', warranty: '6 Months', color: 'White' },
    sourceImages: ['Adapters/Adaptx 1/ADAPTX Adopter 1 - Wagh M..webp', 'Adapters/Adaptx 1/ADAPTX Adopter 2 - Wagh M..webp', 'Adapters/Adaptx 1/ADAPTX Adopter 3 - Wagh M..webp', 'Adapters/Adaptx 1/ADAPTX Adopter 4 - Wagh M..webp'],
    sections: [{
      title: 'Key Features', type: 'list', order: 0,
      items: [
        { label: '', value: 'Dual USB Port: Charge two devices at once', order: 0 },
        { label: '', value: 'Cable-Free Compact Wall Charger', order: 1 },
        { label: '', value: 'BIS Certified (IS 13252 Part 1:2010, R-72006432)', order: 2 },
      ],
    }],
  },

  // --- Cables --------------------------------------------------------------
  {
    categorySlug: 'cables',
    name: 'WAGH® Gripp 120W Type-C to Type-C Cable',
    brand: 'GRIPP',
    price: 799,
    mrp: 799,
    description: '100% genuine copper, 1200mm braided Type-C to Type-C cable rated for 120W max fast charging.',
    specs: { outputPower: '120W Max', cableLength: '1200mm', material: '100% Genuine Copper (Braided)', warranty: '6 Months', color: 'White/Grey' },
    sourceImages: ['GRIPP/white/Type C to C/GRIPP C to Type C 1 - White - Hanuman Mobile.webp', 'GRIPP/white/Type C to C/GRIPP C to Type C 2 - White - Hanuman Mobile.webp', 'GRIPP/white/Type C to C/GRIPP C to Type C 3 - White - Hanuman Mobile.webp', 'GRIPP/white/Type C to C/GRIPP C to Type C 4 - White - Hanuman Mobile.webp'],
    sections: [{
      title: 'Key Features', type: 'list', order: 0,
      items: [
        { label: '', value: '100% Genuine Copper Cable', order: 0 },
        { label: '', value: 'Short Circuit & Overcharge Protection', order: 1 },
        { label: '', value: 'Braided Outer Jacket', order: 2 },
        { label: '', value: 'CE, FC Certified, Made in India', order: 3 },
      ],
    }],
  },
  {
    categorySlug: 'cables',
    name: 'WAGH® Hunter 120W Type-C to Type-C Cable (2M)',
    brand: 'Hunter',
    price: 799,
    mrp: 799,
    description: '100% genuine copper, 2000mm braided Type-C to Type-C cable rated for 120W max fast charging.',
    specs: { outputPower: '120W Max', cableLength: '2000mm', material: '100% Genuine Copper (Braided)', warranty: '6 Months', color: 'Black' },
    sourceImages: ['Hunter_Cables/2M (2 Meater)/Type C to C/Hunter 2M - Type C to C 1 - Hanuman Mobile.webp', 'Hunter_Cables/2M (2 Meater)/Type C to C/Hunter 2M - Type C to C 2 - Hanuman Mobile.webp', 'Hunter_Cables/2M (2 Meater)/Type C to C/Hunter 2M - Type C to C 3 - Hanuman Mobile.webp', 'Hunter_Cables/2M (2 Meater)/Type C to C/Hunter 2M - Type C to C 4 - Hanuman Mobile.webp'],
    sections: [{
      title: 'Key Features', type: 'list', order: 0,
      items: [
        { label: '', value: '100% Genuine Copper Cable', order: 0 },
        { label: '', value: 'Premium Braided Outer Jacket', order: 1 },
        { label: '', value: 'Short Circuit & Overcharge Protection', order: 2 },
        { label: '', value: 'CE, FC Certified, Made in India', order: 3 },
      ],
    }],
  },

  // --- Neckbands -----------------------------------------------------------
  // NOTE: the source catalog (wagh_bullet_z2_neckband_catalog.xlsx) left the
  // Price/MRP columns blank. These two prices are estimates based on
  // comparable ENC neckbands in the other catalogs, not sourced values.
  {
    categorySlug: 'neckbands',
    name: 'WAGH® Bullet Z2 Wireless Neckband - Black',
    brand: 'WAGH',
    price: 899,
    mrp: 1299,
    description: 'ENC wireless neckband with 60H backup, magnetic on/off design, and Hi-Fi sound. Bluetooth v5.0, 10m range.',
    specs: { outputPower: 'N/A', compatibility: 'Universal (iOS & Android)', warranty: '6 Months', color: 'Black' },
    sourceImages: ['Neckbands/Black Color/Bullet Z2 Neckband 1 - Black - Hanuman Mobile.webp', 'Neckbands/Black Color/Bullet Z2 Neckband 2 - Black - Hanuman Mobile.webp', 'Neckbands/Black Color/Bullet Z2 Neckband 3 - Black - Hanuman Mobile.webp', 'Neckbands/Black Color/Bullet Z2 Neckband 4 - Black - Hanuman Mobile.webp'],
    sections: [{
      title: 'Key Features', type: 'list', order: 0,
      items: [
        { label: '', value: 'ENC (Environmental Noise Cancellation)', order: 0 },
        { label: '', value: 'Magnetic On/Off Design (wear like a necklace)', order: 1 },
        { label: '', value: '60 Hours Non-Stop Playtime / 300H Standby', order: 2 },
        { label: '', value: 'Bluetooth v5.0, 10m Range', order: 3 },
      ],
    }],
  },
  {
    categorySlug: 'neckbands',
    name: 'WAGH® Bullet Z2 Wireless Neckband - Red',
    brand: 'WAGH',
    price: 899,
    mrp: 1299,
    description: 'ENC wireless neckband with 60H backup, magnetic on/off design, and Hi-Fi sound. Bluetooth v5.0, 10m range.',
    specs: { outputPower: 'N/A', compatibility: 'Universal (iOS & Android)', warranty: '6 Months', color: 'Red' },
    sourceImages: ['Neckbands/Red Color/Bullet Z2 Neckband 1 - Red - Hanuman Mobile.webp', 'Neckbands/Red Color/Bullet Z2 Neckband 2 - Red - Hanuman Mobile.webp', 'Neckbands/Red Color/Bullet Z2 Neckband 3 - Red - Hanuman Mobile.webp', 'Neckbands/Red Color/Bullet Z2 Neckband 4 - Red - Hanuman Mobile.webp'],
    sections: [{
      title: 'Key Features', type: 'list', order: 0,
      items: [
        { label: '', value: 'ENC (Environmental Noise Cancellation)', order: 0 },
        { label: '', value: 'Magnetic On/Off Design (wear like a necklace)', order: 1 },
        { label: '', value: '60 Hours Non-Stop Playtime / 300H Standby', order: 2 },
        { label: '', value: 'Bluetooth v5.0, 10m Range', order: 3 },
      ],
    }],
  },
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to ${MONGODB_URI}`);

  const categoryIdBySlug = {};
  for (const cat of CATEGORIES) {
    let doc = await Category.findOne({ slug: cat.slug });
    if (!doc) {
      doc = await Category.create(cat);
      console.log(`Created category: ${cat.name}`);
    } else {
      console.log(`Category already exists: ${cat.name}`);
    }
    categoryIdBySlug[cat.slug] = doc._id;
  }

  let created = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    const existing = await Product.findOne({ slug });
    if (existing) {
      console.log(`Skipped (already exists): ${p.name}`);
      skipped++;
      continue;
    }

    const images = copyImages(slug, p.sourceImages);

    await Product.create({
      name: p.name,
      description: p.description,
      price: p.price,
      mrp: p.mrp,
      images,
      category: categoryIdBySlug[p.categorySlug],
      brand: p.brand,
      specs: p.specs,
      sections: p.sections,
      stock: 100,
    });

    console.log(`Created product: ${p.name}`);
    created++;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped} (already present).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
