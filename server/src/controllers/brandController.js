const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Product = require('../models/Product');
const cache = require('../utils/cache');

// @desc    Get brands for a category — the public counterpart to
//          GET /api/v1/categories. Reads live from the Brand collection (the
//          same source of truth the admin's "Manage Brands" screen writes to),
//          so a brand created in the admin panel appears here immediately,
//          even before any product uses it yet — exactly like a freshly
//          created Category shows up with zero products.
// @route   GET /api/v1/brands?category=<slug|id|name>
exports.getBrands = async (req, res, next) => {
  try {
    if (!req.query.category) {
      return res.json({ success: true, data: [], message: 'No category provided' });
    }

    const cacheKey = `brands:public:${req.query.category}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      // Deliberately no browser-facing Cache-Control here — the fast path is
      // this in-process cache, which an admin write invalidates immediately.
      // A `max-age` header would let the *browser's own* HTTP cache keep
      // serving a brand-new-brand-shaped hole for up to that long, entirely
      // bypassing the invalidation below (this was the actual bug behind a
      // freshly created brand "not showing on the client").
      res.set('Cache-Control', 'no-store');
      return res.json(cached);
    }

    // Same category resolution (id / slug / name) the product listing uses.
    const categories = req.query.category.split(',').map((c) => c.trim()).filter(Boolean);
    const validObjectIds = categories.filter((c) => c.match(/^[0-9a-fA-F]{24}$/));

    const catObjs = await Category.find({
      $or: [
        { _id: { $in: validObjectIds } },
        { slug: { $in: categories } },
        { name: { $in: categories.map((c) => new RegExp(`^${c.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i')) } },
      ],
    }).select('_id').lean();

    const matchedCategoryIds = Array.from(new Set([
      ...catObjs.map((c) => c._id.toString()),
      ...validObjectIds,
    ]));

    if (matchedCategoryIds.length === 0) {
      const payload = { success: true, data: [], message: 'Brands fetched successfully' };
      cache.set(cacheKey, payload, 60);
      return res.json(payload);
    }

    const brands = await Brand.find({ category: { $in: matchedCategoryIds } }).sort({ name: 1 }).lean();

    // Live product counts, purely informational (a brand with 0 is still shown).
    const counts = await Product.aggregate([
      {
        $match: {
          category: { $in: matchedCategoryIds.map((id) => new mongoose.Types.ObjectId(id)) },
          parentId: null,
        },
      },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
    ]);
    const countByName = Object.fromEntries(counts.map((c) => [c._id, c.count]));

    const data = brands.map((b) => ({
      brand: b.name,
      slug: b.slug,
      count: countByName[b.name] || 0,
    }));

    const payload = {
      success: true,
      data,
      message: 'Brands fetched successfully',
    };

    cache.set(cacheKey, payload, 60);
    res.set('Cache-Control', 'no-store');
    res.json(payload);
  } catch (error) {
    next(error);
  }
};
