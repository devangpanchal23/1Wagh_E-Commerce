const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  mrp: {
    type: Number,
    required: [true, 'MRP is required'],
    min: 0,
  },
  images: {
    type: [mongoose.Schema.Types.Mixed],
    validate: [val => val && val.length > 0, 'At least one product image is required'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  brand: {
    type: String,
    default: 'WAGH',
  },
  specs: {
    outputPower: { type: String, default: '' },
    compatibility: { type: String, default: '' },
    cableLength: { type: String, default: '' },
    dimensions: { type: String, default: '' },
    size: { type: String, default: '' },
    height: { type: String, default: '' },
    width: { type: String, default: '' },
    warranty: { type: String, default: '24 Months' },
    color: { type: String, default: 'Deep Teal' },
    material: { type: String, default: '' },
  },
  sections: [
    {
      title: { type: String, required: true, trim: true },
      type: {
        type: String,
        enum: ['specifications', 'keyFeatures', 'details', 'table', 'list', 'text'],
        default: 'table'
      },
      items: [
        {
          label: { type: String, default: '', trim: true },
          value: { type: String, default: '', trim: true },
          order: { type: Number, default: 0 }
        }
      ],
      content: { type: String, default: '' },
      order: { type: Number, default: 0 }
    }
  ],

  stock: {
    type: Number,
    required: true,
    default: 100,
  },
  ratingAvg: {
    type: Number,
    default: 4.8,
    min: 0,
    max: 5,
  },
  ratingCount: {
    type: Number,
    default: 24,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isNewArrival: {
    type: Boolean,
    default: false,
  },
  isBestSeller: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

productSchema.index({ name: 'text', description: 'text', brand: 'text' });

// --- Query indexes -----------------------------------------------------------
// Every index below backs a filter/sort combination the shop actually issues.
// Without them each listing request is a full collection scan plus an in-memory sort.

// Shop grid: filter by category, sort by newest (the default view)
productSchema.index({ category: 1, createdAt: -1 });

// Shop grid: filter by category, sort by price (both directions use this index)
productSchema.index({ category: 1, price: 1 });

// Price-range filters and the "max price" lookup for the range slider
productSchema.index({ price: 1 });

// Unfiltered listing sorted by newest
productSchema.index({ createdAt: -1 });

// Popularity sort
productSchema.index({ ratingCount: -1, ratingAvg: -1 });

// Brand facet
productSchema.index({ brand: 1 });

// Home page collections. These use partial filters rather than `sparse`: the flags
// default to `false`, so every product would carry the field and a sparse index
// would still cover the whole collection. A partial index stores only the products
// actually in each collection — typically a handful of rows.
productSchema.index(
  { isFeatured: 1, createdAt: -1 },
  { partialFilterExpression: { isFeatured: true } }
);
productSchema.index(
  { isNewArrival: 1, createdAt: -1 },
  { partialFilterExpression: { isNewArrival: true } }
);
productSchema.index(
  { isBestSeller: 1, createdAt: -1 },
  { partialFilterExpression: { isBestSeller: true } }
);

// Auto-generate slug and resolve category before validation
productSchema.pre('validate', async function(next) {
  try {
    if (this.name && !this.slug) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    const { resolveCategoryId } = require('../utils/categoryResolver');
    this.category = await resolveCategoryId(this.category);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Product', productSchema);
