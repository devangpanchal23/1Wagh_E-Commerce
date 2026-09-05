// One-off local-only backfill: populates the new Brand collection from the
// brand names already present on existing products (so the admin's "select a
// brand" dropdown isn't empty on first use), then adds "Fire" as a known
// Cables brand plus one real Fire-series cable product — the same worked
// example from the Cables -> Hunter / Fire / Gripp hierarchy.
//
// Idempotent — re-running skips anything that already exists.
// Usage: node scripts/seedBrands.js

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Brand = require('../src/models/Brand');

const PHOTOS_ROOT = path.join(__dirname, '../../photos-product');
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

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

async function upsertBrand(name, categoryId) {
  const slug = slugify(name);
  const existing = await Brand.findOne({ category: categoryId, slug });
  if (existing) return { brand: existing, created: false };
  const brand = await Brand.create({ name, slug, category: categoryId });
  return { brand, created: true };
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to ${process.env.MONGODB_URI}`);

  const categories = await Category.find().lean();
  let backfilled = 0;

  // Backfill: one Brand doc per distinct (category, brand) pair already used
  // by a real product, so the dropdown reflects what's actually on the site.
  for (const cat of categories) {
    const distinctBrands = await Product.distinct('brand', { category: cat._id, parentId: null });
    for (const brandName of distinctBrands) {
      if (!brandName || !brandName.trim()) continue;
      const { created } = await upsertBrand(brandName.trim(), cat._id);
      if (created) {
        console.log(`Backfilled brand: ${brandName} -> ${cat.name}`);
        backfilled++;
      }
    }
  }

  // Worked example: register "Fire" as a known Cables brand and add the real
  // Fire-series cable (from wagh_fire_series_catalog.xlsx) under it, so the
  // Cables sidebar shows Hunter / Fire / GRIPP end to end.
  const cablesCategory = categories.find((c) => c.slug === 'cables');
  if (cablesCategory) {
    const { brand: fireBrand, created } = await upsertBrand('Fire', cablesCategory._id);
    console.log(created ? 'Created brand: Fire -> Cables' : 'Brand already exists: Fire -> Cables');

    const productName = 'WAGH® Fire 3.1A Fast Charging Cable - USB to Type-C';
    const slug = slugify(productName);
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      console.log('Skipped (already exists): ' + productName);
    } else {
      const images = copyImages(slug, [
        'Cables/Fire series/Type Usb to C/Fire - U to C 1 - Wagh M..webp',
        'Cables/Fire series/Type Usb to C/Fire - U to C 2 - Wagh M..webp',
        'Cables/Fire series/Type Usb to C/Fire - U to C 3 - Wagh M..webp',
        'Cables/Fire series/Type Usb to C/Fire - U to C 4 - Wagh M..webp',
      ]);

      await Product.create({
        name: productName,
        description: '100% copper, high-speed 3.1A fast charging & data sync cable, 1 meter, with a durable molded strain relief.',
        price: 350,
        mrp: 350,
        images,
        category: cablesCategory._id,
        brand: fireBrand.name,
        specs: {
          outputPower: '5V / 3.1A Max',
          cableLength: '1000mm',
          material: '100% Copper',
          warranty: '6 Months',
          color: 'White',
        },
        sections: [{
          title: 'Key Features', type: 'list', order: 0,
          items: [
            { label: '', value: 'High Quality Material, 100% Copper Cable', order: 0 },
            { label: '', value: 'High Speed Data Syncing & Fast Charging', order: 1 },
            { label: '', value: 'CE & FC Certified, Made in India', order: 2 },
          ],
        }],
        stock: 100,
      });
      console.log('Created product: ' + productName);
    }
  }

  console.log(`\nDone. Backfilled ${backfilled} brand(s) from existing products.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
