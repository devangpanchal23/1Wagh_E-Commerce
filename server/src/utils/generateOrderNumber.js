const OrderCounter = require('../models/OrderCounter');

/**
 * Computes timezone-safe IST (Asia/Kolkata) month and year key (MMYY)
 * Example: Aug 14, 2026 => "0826"
 */
function getISTMonthYearKey(dateInput = new Date()) {
  const date = new Date(dateInput);
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: '2-digit',
    year: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const month = parts.find((p) => p.type === 'month')?.value || '01';
  const year = parts.find((p) => p.type === 'year')?.value || '26';
  return `${month}${year}`;
}

/**
 * Atomically generates the canonical customer-facing order number:
 * WAGH-MMYY#### (MM = IST month, YY = year, #### = monthly sequence).
 * Resets to 0001 at the start of every new calendar month in IST.
 * Example: "WAGH-08260001", "WAGH-08260002"
 */
async function generateOrderNumber(dateInput = new Date()) {
  const monthYearKey = getISTMonthYearKey(dateInput);

  const counter = await OrderCounter.findOneAndUpdate(
    { monthYearKey },
    { $inc: { lastSequence: 1 } },
    { new: true, upsert: true }
  );

  const seqPadded = String(counter.lastSequence).padStart(4, '0');
  return `WAGH-${monthYearKey}${seqPadded}`;
}

module.exports = {
  getISTMonthYearKey,
  generateOrderNumber,
};
