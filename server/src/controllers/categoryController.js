const Category = require('../models/Category');
const cache = require('../utils/cache');

exports.getCategories = async (req, res, next) => {
  try {
    // Categories are a handful of rarely-changing rows requested on nearly every
    // page — a 10 minute cache removes that query from the critical path entirely.
    const cached = cache.get('categories:all');
    if (cached) {
      res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1800');
      return res.json(cached);
    }

    const categories = await Category.find().sort({ name: 1 }).lean();

    const payload = {
      success: true,
      data: categories,
      message: 'Categories fetched successfully'
    };

    cache.set('categories:all', payload, 600);
    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1800');
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const category = await Category.create({ name, slug, description, icon });

    cache.invalidate('categories:', 'products:');

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);

    cache.invalidate('categories:', 'products:');

    res.json({
      success: true,
      data: null,
      message: 'Category deleted'
    });
  } catch (error) {
    next(error);
  }
};
