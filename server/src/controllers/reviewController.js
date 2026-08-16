const Review = require('../models/Review');
const Product = require('../models/Product');
const cache = require('../utils/cache');

exports.getProductReviews = async (req, res, next) => {
  try {
    // Served by the { product: 1, createdAt: -1 } index — no in-memory sort
    const reviews = await Review.find({ product: req.params.productId })
      .select('userName rating comment verifiedPurchase createdAt')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({
      success: true,
      data: reviews,
      message: 'Reviews fetched'
    });
  } catch (error) {
    next(error);
  }
};

exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productId;

    const existing = await Review.findOne({ product: productId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      userName: req.user.name,
      rating: Number(rating),
      comment,
    });

    // Let the database compute the new average instead of loading every review
    // document into Node just to sum a single field.
    const [stats] = await Review.aggregate([
      { $match: { product: review.product } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    await Product.findByIdAndUpdate(productId, {
      ratingAvg: Math.round((stats?.avg || Number(rating)) * 10) / 10,
      ratingCount: stats?.count || 1,
    });

    // The product's cached rating is now stale
    cache.invalidate('products:', 'product:');

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review added successfully'
    });
  } catch (error) {
    next(error);
  }
};
