const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Order = require('../src/models/Order');
const OrderCounter = require('../src/models/OrderCounter');
const { getISTMonthYearKey } = require('../src/utils/generateOrderNumber');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wagh_ecommerce';

async function backfillOrderNumbers() {
  try {
    console.log('🔄 Connecting to MongoDB for Order Number Backfill...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    // Find all orders without orderNumber, sorted chronologically ascending
    const unassignedOrders = await Order.find({
      $or: [
        { orderNumber: { $exists: false } },
        { orderNumber: null },
        { orderNumber: '' },
      ],
    }).sort({ createdAt: 1 });

    if (unassignedOrders.length === 0) {
      console.log('✨ All orders already have valid orderNumber fields! No backfill needed.');
      process.exit(0);
    }

    console.log(`📦 Found ${unassignedOrders.length} orders needing orderNumber backfill.`);

    const monthSummary = {};
    let totalBackfilled = 0;

    for (const order of unassignedOrders) {
      const createdDate = order.createdAt || new Date();
      const monthYearKey = getISTMonthYearKey(createdDate);

      // Atomically increment counter for the order's creation month
      const counter = await OrderCounter.findOneAndUpdate(
        { monthYearKey },
        { $inc: { lastSequence: 1 } },
        { new: true, upsert: true }
      );

      const seqPadded = String(counter.lastSequence).padStart(4, '0');
      const generatedOrderNumber = `WAGH-${monthYearKey}${seqPadded}`;

      // Keep both fields identical while legacy API consumers are still present.
      order.orderNumber = generatedOrderNumber;
      order.orderId = generatedOrderNumber;
      await order.save();

      totalBackfilled += 1;
      if (!monthSummary[monthYearKey]) {
        monthSummary[monthYearKey] = {
          count: 0,
          firstSeq: generatedOrderNumber,
          lastSeq: generatedOrderNumber,
        };
      }
      monthSummary[monthYearKey].count += 1;
      monthSummary[monthYearKey].lastSeq = generatedOrderNumber;
    }

    console.log('\n======================================================');
    console.log('🎉 ORDER NUMBER BACKFILL COMPLETED SUCCESSFULLY!');
    console.log(`📊 Total Orders Backfilled: ${totalBackfilled}`);
    console.log('------------------------------------------------------');
    for (const [monthKey, info] of Object.entries(monthSummary)) {
      console.log(`  • Month Key [${monthKey}]: ${info.count} orders (${info.firstSeq} to ${info.lastSeq})`);
    }
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during order number backfill:', error);
    process.exit(1);
  }
}

backfillOrderNumbers();
