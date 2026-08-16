const mongoose = require('mongoose');

const paymentReceiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  orderIdString: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  paymentTime: {
    type: String,
    required: true,
  },
  paymentMode: {
    type: String,
    required: true,
  },
  gatewayTransactionId: {
    type: String,
    default: '',
  },
  subtotal: {
    type: Number,
    required: true,
  },
  gstAmount: {
    type: Number,
    default: 0,
  },
  gstBreakdown: {
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
  },
  couponCode: {
    type: String,
    default: '',
  },
  couponDiscountAmount: {
    type: Number,
    default: 0,
  },
  finalAmountPaid: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Success', 'Pending', 'Failed', 'Refunded'],
    default: 'Success',
  },
}, {
  timestamps: true,
});

paymentReceiptSchema.index({ order: 1 });
paymentReceiptSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentReceipt', paymentReceiptSchema);
