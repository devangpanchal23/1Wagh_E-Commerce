/**
 * Concurrent Stock Decrement Verification Script
 * Tests that 10 simultaneous orders attempting to purchase the last unit (stock = 1)
 * results in exactly 1 successful purchase and 9 rejected requests (no overselling).
 */

require('dotenv').config();
const mongoose = require('mongoose');
require('../src/models/Category');
const Product = require('../src/models/Product');

async function testConcurrency() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB for Concurrency Test...');
    await mongoose.connect(mongoUri);

    // Create a temporary test product with 1 unit in stock
    const testSku = `CONCUR-TEST-${Date.now()}`;
    const testProduct = await Product.create({
      name: 'Concurrency Test Product',
      description: 'Temporary product to verify atomic stock decrement',
      price: 100,
      mrp: 200,
      images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600'],
      category: new mongoose.Types.ObjectId(),
      hasVariants: true,
      variants: [
        {
          color: { name: 'Black', hex: '#000000' },
          images: [],
          sizes: [
            {
              sku: testSku,
              label: '1M',
              price: 100,
              mrp: 200,
              stock: 1, // Only 1 unit in stock!
            },
          ],
        },
      ],
    });

    console.log(`📦 Created Test Product with SKU '${testSku}' (Initial Stock: 1)`);

    // Simulate 10 simultaneous checkout requests trying to decrement 1 unit
    console.log('⚡ Launching 10 simultaneous atomic decrement requests...');

    const decrementPromises = Array.from({ length: 10 }).map((_, idx) =>
      Product.findOneAndUpdate(
        {
          _id: testProduct._id,
          'variants.sizes.sku': testSku,
          'variants.sizes.stock': { $gte: 1 },
        },
        {
          $inc: { 'variants.$[v].sizes.$[s].stock': -1 },
        },
        {
          arrayFilters: [{ 'v.sizes.sku': testSku }, { 's.sku': testSku }],
          new: true,
        }
      )
    );

    const results = await Promise.all(decrementPromises);

    const successful = results.filter((res) => res !== null);
    const failed = results.filter((res) => res === null);

    console.log(`\n📊 Concurrency Test Results:`);
    console.log(`  └─ Successful Decrements: ${successful.length}`);
    console.log(`  └─ Rejected Requests (Out of stock): ${failed.length}`);

    // Verify final stock count in database
    const finalProduct = await Product.findById(testProduct._id).lean();
    const finalStock = finalProduct.variants[0].sizes[0].stock;
    console.log(`  └─ Final Stock in DB: ${finalStock}`);

    // Cleanup test product
    await Product.findByIdAndDelete(testProduct._id);
    console.log(`🧹 Cleaned up temporary test product.`);

    if (successful.length === 1 && failed.length === 9 && finalStock === 0) {
      console.log('\n🎉 CONCURRENCY TEST PASSED! No overselling occurred under 10 parallel requests.');
    } else {
      console.error('\n❌ CONCURRENCY TEST FAILED! Race condition detected.');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error running concurrency test:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testConcurrency();
