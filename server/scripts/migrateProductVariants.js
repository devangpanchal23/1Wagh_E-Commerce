/**
 * One-Off Migration Script for Product Variants
 * Verifies and sets `hasVariants: false` for legacy products without altering document data.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function runMigration() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected.');

    const countBefore = await Product.countDocuments({ hasVariants: { $exists: false } });
    console.log(`📦 Found ${countBefore} legacy product(s) missing 'hasVariants' field.`);

    if (countBefore > 0) {
      const result = await Product.updateMany(
        { hasVariants: { $exists: false } },
        { $set: { hasVariants: false, variants: [] } }
      );
      console.log(`✅ Updated ${result.modifiedCount} product(s) with 'hasVariants: false'.`);
    } else {
      console.log('✅ All existing products already have valid variant flags.');
    }

    console.log('🎉 Migration script completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runMigration();
