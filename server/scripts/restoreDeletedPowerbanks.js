// One-off restore script: re-adds 3 powerbank products the user deleted from
// production (Travel Partner, Mini Powerbank White, Mini Powerbank Yellow/Black),
// using the production image convention (/product-images/<file>.webp) and the
// exact catalog data from WAGH_Powerbanks_Catalog_Details.xlsx.
// Idempotent — skips any product whose slug already exists.
//
// Usage: MONGODB_URI=<production uri> node scripts/restoreDeletedPowerbanks.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
require('../src/models/Category');
const Product = require('../src/models/Product');

const MONGODB_URI = process.env.MONGODB_URI;
const POWERBANK_CATEGORY_ID = '6a7eadf21c2f404c6865cf1a';

function img(filename) {
  const publicId = filename.replace(/\.webp$/, '');
  return { url: `/product-images/${filename}`, filename, publicId, isPrimary: false };
}
function withPrimary(files) {
  return files.map((f, i) => ({ ...img(f), isPrimary: i === 0 }));
}

const PRODUCTS = [
  {
    name: 'WAGH® Travel Partner 10000mAh 2.4A Fast Charging Powerbank',
    description: '• 2.4A Fast Charging\n• Travel Partner Compact Slim Design\n• Double USB Output Ports\n• Dual Input Options (Micro USB & Type-C)\n• LED Power Button Indicator • Affordable, reliable standard fast charging for everyday travel\n• Allows dual USB output charging simultaneously\n• Dual input ports enable convenient recharge with either Type-C or Micro-USB cable',
    price: 1499,
    mrp: 1499,
    sku: '014',
    images: withPrimary(['liner-powerbank-1-10000mah.webp', 'liner-powerbank-2-10000mah.webp', 'liner-powerbank-3-10000mah.webp', 'liner-powerbank-4-10000mah.webp']),
    specs: {
      outputPower: 'DC 5V / 2.4A (Dual USB Output Ports)',
      compatibility: '2.4A Fast Charging Standard',
      cableLength: '', dimensions: '', size: '10000mAh', height: '', width: '',
      warranty: '6 Month Warranty. Covers manufacturing defects (Replacement only). Does not cover defects/damage caused by reasons outside control. Claim requires original proof of purchase.',
      color: 'Black', material: '',
    },
  },
  {
    name: 'WAGH® Mini Powerbank (25W PD + QC with Built-in Cables) - White',
    description: '• 25W PD + QC Fast Charging\n• Built-in Type-C and Lightning Cables\n• LED Digital Percentage Display (100% indicator)\n• Dual Inbuilt Lanyard-style Cables • Maximum portability without needing extra cables\n• Charges both iOS (Lightning) and Android/Type-C devices out of the box\n• Real-time digital battery percentage status',
    price: 2999,
    mrp: 2999,
    sku: '015',
    images: withPrimary(['mini-powerbank-1-white.webp', 'mini-powerbank-2-white.webp', 'mini-powerbank-3-white.webp', 'mini-powerbank-4-white.webp']),
    specs: {
      outputPower: 'DC 5V/3A, 9V/2A, 12V/1.5A (Max 22.5W)',
      compatibility: 'Qualcomm Quick Charge 3.0 + Power Delivery (PD) + Vooc Charge Support',
      cableLength: '', dimensions: '', size: '10000mAh Long-Lasting Power', height: '', width: '',
      warranty: '6 Month Warranty. Covers manufacturing defects (Replacement only). Does not cover defects/damage caused by reasons outside control. Claim requires original proof of purchase.',
      color: 'White', material: '',
    },
  },
  {
    name: 'WAGH® Mini Powerbank (25W PD + QC with Built-in Cables)',
    description: '• 25W PD + QC Fast Charging\n• Built-in Type-C and Lightning Cable\n• Digital Battery Level Display (100% indicator)\n• Vibrant Yellow Dual-Tone Body Design • Compact cable-free convenience for both Android and iPhone\n• Distinctive high-visibility aesthetic design\n• Quick charge support up to 22.5W max output',
    price: 2799,
    mrp: 2799,
    sku: '011',
    images: withPrimary(['mini-powerbank-1-black.webp', 'mini-powerbank-2-black.webp', 'mini-powerbank-3-black.webp', 'mini-powerbank-4-black.webp']),
    specs: {
      outputPower: 'DC 5V/3A, 9V/2A, 12V/1.5A (Max 22.5W)',
      compatibility: 'Qualcomm Quick Charge 3.0 + Power Delivery (PD) + Vooc Charge Support',
      cableLength: '', dimensions: '', size: '10000mAh Long-Lasting Power', height: '', width: '',
      warranty: '6 Month Warranty. Covers manufacturing defects (Replacement only). Does not cover defects/damage caused by reasons outside control. Claim requires original proof of purchase.',
      color: 'Yellow/Black', material: '',
    },
  },
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

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

    await Product.create({
      name: p.name,
      description: p.description,
      price: p.price,
      mrp: p.mrp,
      images: p.images,
      category: POWERBANK_CATEGORY_ID,
      brand: 'WAGH',
      sku: p.sku,
      specs: p.specs,
      sections: [],
      stock: 100,
      ratingAvg: 4.8,
      ratingCount: 24,
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
