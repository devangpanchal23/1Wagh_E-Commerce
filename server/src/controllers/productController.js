const Product = require('../models/Product');
const Category = require('../models/Category');
const { resolveCategoryId } = require('../utils/categoryResolver');
const cache = require('../utils/cache');

// Fields a product grid card actually renders. Skipping `sections` and `description`
// keeps listing payloads small — those are only needed on the detail page.
const LIST_PROJECTION =
  'name slug price mrp images category brand stock ratingAvg ratingCount isFeatured isNewArrival isBestSeller hasVariants variants createdAt';

// @desc    Get products with search, filter, sort & pagination
// @route   GET /api/v1/products
exports.getProducts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    // Cap the page size so a crafted `?limit=100000` can't pull the whole catalog
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 60);
    const skip = (page - 1) * limit;

    // Serve identical listing requests straight from memory (60s TTL)
    const cacheKey = `products:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return res.json(cached);
    }

    const query = {};

    // Search query
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { brand: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Category filter
    if (req.query.category) {
      const categories = req.query.category.split(',').map(c => c.trim()).filter(Boolean);
      const validObjectIds = categories.filter(c => c.match(/^[0-9a-fA-F]{24}$/));

      const catObjs = await Category.find({
        $or: [
          { _id: { $in: validObjectIds } },
          { slug: { $in: categories } },
          { name: { $in: categories.map(c => new RegExp(`^${c.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i')) } }
        ]
      }).select('_id').lean();

      const matchedCategoryIds = Array.from(new Set([
        ...catObjs.map(c => c._id.toString()),
        ...validObjectIds
      ]));

      if (matchedCategoryIds.length > 0) {
        query.category = { $in: matchedCategoryIds };
      }
    }

    // Brand filter
    if (req.query.brand) {
      const brands = req.query.brand.split(',');
      query.brand = { $in: brands };
    }

    // In Stock filter
    if (req.query.inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Sorting
    let sort = { createdAt: -1 }; // default newest
    if (req.query.sort === 'price-asc') sort = { price: 1 };
    else if (req.query.sort === 'price-desc') sort = { price: -1 };
    else if (req.query.sort === 'popularity') sort = { ratingCount: -1, ratingAvg: -1 };
    else if (req.query.sort === 'newest') sort = { createdAt: -1 };

    // Max price for the range slider, ignoring the price filter itself
    const maxPriceQuery = { ...query };
    delete maxPriceQuery.price;

    // These three queries are independent — run them on one round trip instead of
    // three sequential ones. `.lean()` skips Mongoose document hydration, which is
    // the bulk of the CPU cost on a listing response.
    const [total, products, highestProduct] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .select(LIST_PROJECTION)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.findOne(maxPriceQuery).sort({ price: -1 }).select('price').lean(),
    ]);

    const maxProductPrice = highestProduct ? Math.ceil(highestProduct.price) : 2000;

    const payload = {
      success: true,
      data: {
        products,
        page,
        pages: Math.ceil(total / limit),
        total,
        maxProductPrice,
      },
      message: 'Products fetched successfully'
    };

    cache.set(cacheKey, payload, 60);
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID or slug
// @route   GET /api/v1/products/:id
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cacheKey = `product:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return res.json(cached);
    }

    // Both lookups hit a unique index (_id or slug); `.lean()` avoids hydrating
    // the full document including its `sections` subdocument array.
    const filter = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
    const product = await Product.findOne(filter)
      .populate('category', 'name slug')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const payload = {
      success: true,
      data: product,
      message: 'Product fetched successfully'
    };

    cache.set(cacheKey, payload, 60);
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product (Admin)
// @route   POST /api/v1/products
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, mrp, images, category, brand, specs, stock, isFeatured, isNewArrival, isBestSeller, hasVariants, variants } = req.body;
    
    const resolvedCategory = await resolveCategoryId(category);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();

    const product = await Product.create({
      name,
      slug,
      description,
      price,
      mrp,
      images: images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop'],
      category: resolvedCategory,
      brand: brand || 'WAGH',
      specs: specs || {},
      stock: stock !== undefined ? stock : 100,
      isFeatured: !!isFeatured,
      isNewArrival: !!isNewArrival,
      isBestSeller: !!isBestSeller,
      hasVariants: !!hasVariants,
      variants: variants || [],
    });

    cache.invalidate('products:', 'product:');

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/v1/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    Object.assign(product, req.body);
    if (req.body.category || !product.category) {
      product.category = await resolveCategoryId(req.body.category);
    }

    if (req.body.name) {
      product.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const updatedProduct = await product.save();

    cache.invalidate('products:', 'product:');

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/v1/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    cache.invalidate('products:', 'product:');

    res.json({
      success: true,
      data: null,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get home page collections (Featured, Best Sellers, New Arrivals)
// @route   GET /api/v1/products/collections/featured
exports.getHomeCollections = async (req, res, next) => {
  try {
    // The home page is the single most requested endpoint — cache it for 5 minutes.
    const cacheKey = 'products:collections:featured';
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      return res.json(cached);
    }

    const collection = (flag) =>
      Product.find({ [flag]: true })
        .select(LIST_PROJECTION)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

    // Three independent queries — one round trip instead of three sequential ones
    const [bestSellers, newArrivals, featured] = await Promise.all([
      collection('isBestSeller'),
      collection('isNewArrival'),
      collection('isFeatured'),
    ]);

    const payload = {
      success: true,
      data: {
        bestSellers,
        newArrivals,
        featured,
      },
      message: 'Home collections fetched successfully'
    };

    cache.set(cacheKey, payload, 300);
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(payload);
  } catch (error) {
    next(error);
  }
};
