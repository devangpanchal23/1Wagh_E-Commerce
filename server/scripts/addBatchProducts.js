// One-off seeder for a batch of new products (Mini Powerbank White variant,
// 100W 1500mm Data Cables, and copy_ duplicates of those two cables).
// Idempotent — re-running skips any product whose slug already exists.
//
// Usage: node scripts/addBatchProducts.js

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

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

const typeCCableBase = {
  name: 'WAGH® Data Cable 100W Supported - Braided Material, 1500mm, USB-A to Type-C',
  brand: 'WAGH',
  sku: 'PROD-001',
  price: 549,
  mrp: 549,
  description: '100W supported fast charging braided data cable, 1500mm, USB-A to Type-C, with flat anti-winding design and rust-resistant plug.',
  specs: {
    outputPower: '100W Supported (Fast Charging)',
    cableLength: '1500mm',
    material: 'Braided Material Outer / Environmental Silicone Wire',
    warranty: '6 Months',
    color: 'Black',
  },
  sourceImages: [
    'Cables/100W datacable/Type Usb to C/100W Datacable - U to C 1 - Wagh M..webp',
    'Cables/100W datacable/Type Usb to C/100W Datacable - U to C 2 - Wagh M..webp',
    'Cables/100W datacable/Type Usb to C/100W Datacable - U to C 3 - Wagh M..webp',
    'Cables/100W datacable/Type Usb to C/100W Datacable - U to C 4 - Wagh M..webp',
  ],
  sections: [{
    title: 'Key Features', type: 'list', order: 0,
    items: [
      { label: '', value: '100W Supported Fast Charging', order: 0 },
      { label: '', value: 'Flat Design, Anti-Winding, Rust-Resistant Plug', order: 1 },
      { label: '', value: 'Soft & Flexible, High Tensile & Bending Strength', order: 2 },
      { label: '', value: 'CE, FC Certified, Made in India', order: 3 },
    ],
  }],
};

const microCableBase = {
  name: 'WAGH® Data Cable 100W Supported - Braided Material, 1500mm, USB-A to Micro USB',
  brand: 'WAGH',
  sku: 'PROD-002',
  price: 499,
  mrp: 499,
  description: '100W supported fast charging braided data cable, 1500mm, USB-A to Micro USB, with flat anti-winding design and rust-resistant plug.',
  specs: {
    outputPower: '100W Supported (Fast Charging)',
    cableLength: '1500mm',
    material: 'Braided Material Outer / Environmental Silicone Wire',
    warranty: '6 Months',
    color: 'Black',
  },
  sourceImages: [
    'Cables/100W datacable/Type Usb to Mircro/100W Datacable - U to M 1 - Wagh M..webp',
    'Cables/100W datacable/Type Usb to Mircro/100W Datacable - U to M 2 - Wagh M..webp',
    'Cables/100W datacable/Type Usb to Mircro/100W Datacable - U to M 3 - Wagh M..webp',
    'Cables/100W datacable/Type Usb to Mircro/100W Datacable - U to M 4 - Wagh M..webp',
  ],
  sections: [{
    title: 'Key Features', type: 'list', order: 0,
    items: [
      { label: '', value: '100W Supported Fast Charging', order: 0 },
      { label: '', value: 'Flat Design, Anti-Winding, Rust-Resistant Plug', order: 1 },
      { label: '', value: 'Soft & Flexible, High Tensile & Bending Strength', order: 2 },
      { label: '', value: 'CE, FC Certified, Made in India', order: 3 },
    ],
  }],
};

const PRODUCTS = [
  {
    categorySlug: 'power-banks',
    ...{
      name: 'WAGH® Mini Powerbank (25W PD + QC with Built-in Cables) - White',
      brand: 'WAGH',
      price: 2999,
      mrp: 2999,
      description: '10000mAh power bank with 25W PD + QC fast charging and built-in Type-C and Lightning cables — no separate cable needed.',
      specs: { outputPower: '25W Max (PD + QC 3.0)', compatibility: 'iOS (Lightning) & Android/Type-C', warranty: '6 Months', color: 'White' },
      sourceImages: [
        'powerbanks/Mini_PowerBank/White/Mini PowerBank 1 - White - Wagh M.webp',
        'powerbanks/Mini_PowerBank/White/Mini PowerBank 2 - White - Wagh M.webp',
        'powerbanks/Mini_PowerBank/White/Mini PowerBank 3 - White - Wagh M.webp',
        'powerbanks/Mini_PowerBank/White/Mini PowerBank 4 - White - Wagh M.webp',
      ],
      sections: [{
        title: 'Key Features', type: 'list', order: 0,
        items: [
          { label: '', value: '25W PD + QC Fast Charging', order: 0 },
          { label: '', value: 'Built-in Type-C and Lightning Cables', order: 1 },
          { label: '', value: 'LED Digital Percentage Display', order: 2 },
          { label: '', value: 'Dual Inbuilt Lanyard-style Cables', order: 3 },
          { label: '', value: 'BIS Certified (IS 13252 Part 1:2010, R-72006432)', order: 4 },
        ],
      }],
    },
  },
  { categorySlug: 'cables', ...typeCCableBase },
  { categorySlug: 'cables', ...microCableBase },
  { categorySlug: 'cables', ...typeCCableBase, name: `copy_${typeCCableBase.name}`, sku: '' },
  { categorySlug: 'cables', ...microCableBase, name: `copy_${microCableBase.name}`, sku: '' },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to ${MONGODB_URI}`);

  const categoryIdBySlug = {};
  for (const slug of ['power-banks', 'cables']) {
    const doc = await Category.findOne({ slug });
    if (!doc) throw new Error(`Category not found: ${slug}`);
    categoryIdBySlug[slug] = doc._id;
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
      sku: p.sku || '',
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
