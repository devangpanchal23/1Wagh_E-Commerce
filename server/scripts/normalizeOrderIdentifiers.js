const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Order = require('../src/models/Order');
const OrderCounter = require('../src/models/OrderCounter');
const PaymentReceipt = require('../src/models/PaymentReceipt');
const { generateOrderNumber } = require('../src/utils/generateOrderNumber');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wagh_ecommerce';

function canonicalOrderNumber(value) {
  const match = String(value || '').match(/^(?:WAGH-)?(\d{8})$/i);
  return match ? `WAGH-${match[1]}` : '';
}

async function normalizeOrderIdentifiers() {
  try {
    await mongoose.connect(MONGODB_URI);
    const orders = await Order.find().sort({ createdAt: 1 });
    let updated = 0;

    // Advance counters to at least the highest sequence already assigned for
    // each month before generating IDs for truly legacy records.
    const highestSequences = new Map();
    for (const order of orders) {
      const canonical = canonicalOrderNumber(order.orderNumber);
      if (!canonical) continue;
      const [, monthYearKey, sequence] = canonical.match(/^WAGH-(\d{4})(\d{4})$/);
      highestSequences.set(monthYearKey, Math.max(highestSequences.get(monthYearKey) || 0, Number(sequence)));
    }
    await Promise.all([...highestSequences].map(([monthYearKey, lastSequence]) =>
      OrderCounter.findOneAndUpdate(
        { monthYearKey },
        { $max: { lastSequence } },
        { upsert: true }
      )
    ));

    for (const order of orders) {
      // Preserve an existing monthly sequence where possible; only generate a
      // sequence for legacy orders that never received an order number.
      const canonical = canonicalOrderNumber(order.orderNumber) || await generateOrderNumber(order.createdAt);
      if (order.orderId !== canonical || order.orderNumber !== canonical) {
        order.orderId = canonical;
        order.orderNumber = canonical;
        await order.save();
        updated += 1;
      }

      await PaymentReceipt.updateMany(
        { order: order._id },
        { $set: { orderIdString: canonical } }
      );
    }

    console.log(`Normalized ${updated} order identifier${updated === 1 ? '' : 's'} to WAGH-MMYY####.`);
  } catch (error) {
    console.error('Order identifier normalization failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

normalizeOrderIdentifiers();
