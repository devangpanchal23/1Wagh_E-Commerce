const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: [true, 'Discount type is required'],
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative'],
  },
  minCartValue: {
    type: Number,
    default: 0,
    min: [0, 'Minimum cart value cannot be negative'],
  },
  maxDiscountCap: {
    type: Number,
    default: null,
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
  },
  usageLimit: {
    type: Number,
    default: null,
  },
  usageLimitPerUser: {
    type: Number,
    default: 1,
    min: [1, 'Per user limit must be at least 1'],
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  usedBy: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      count: {
        type: Number,
        default: 1,
      },
      lastUsedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

couponSchema.index({ code: 1, status: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
