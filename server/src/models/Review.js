const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  verifiedPurchase: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

// Product detail page: fetch a product's reviews newest-first
reviewSchema.index({ product: 1, createdAt: -1 });

// "Has this user already reviewed this product?" guard — unique also prevents duplicates
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
