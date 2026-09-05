const mongoose = require('mongoose');

// A curated, per-category list of brand names an admin can pick from when
// assigning a product (e.g. Cables -> Hunter / Fire / GRIPP). Deliberately NOT
// referenced by Product — Product.brand stays the plain string it always was,
// so this collection is purely a management/autocomplete layer. Deleting a
// Brand here never orphans or mutates any existing product; it only removes
// that name from future "add/edit product" dropdowns.
const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Brand must belong to a category'],
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
}, {
  timestamps: true,
});

// A brand name only needs to be unique within its own category — "WAGH"
// legitimately exists under every category.
brandSchema.index({ category: 1, slug: 1 }, { unique: true });
brandSchema.index({ category: 1, name: 1 }, { unique: true });

brandSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

module.exports = mongoose.model('Brand', brandSchema);
