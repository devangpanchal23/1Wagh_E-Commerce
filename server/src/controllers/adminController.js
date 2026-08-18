const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const { resolveCategoryId } = require('../utils/categoryResolver');
const cache = require('../utils/cache');

// @desc    Admin authentication with username & password
// @route   POST /api/v1/admin/login
exports.adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide admin username and password',
      });
    }

    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    const envPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const envPlainPassword = process.env.ADMIN_PASSWORD || 'admin2026';

    if (username.trim() !== expectedUsername) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin username or password',
      });
    }

    let isMatch = false;

    // Check against bcrypt hash if available
    if (envPasswordHash) {
      try {
        isMatch = await bcrypt.compare(password.trim(), envPasswordHash);
      } catch (err) {
        isMatch = false;
      }
    }

    // Fallback to plain env password check if hash comparison wasn't successful
    if (!isMatch && envPlainPassword) {
      isMatch = password.trim() === envPlainPassword.trim();
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin username or password',
      });
    }

    const adminSecret = process.env.ADMIN_JWT_SECRET || 'wagh_admin_dedicated_jwt_secret_key_2026_secure';
    const token = jwt.sign(
      {
        username: expectedUsername,
        role: 'admin',
        type: 'admin_session',
      },
      adminSecret,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      success: true,
      token,
      expiresIn: 8 * 3600,
      admin: {
        username: expectedUsername,
        role: 'admin',
      },
      message: 'Admin authentication successful',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin logout endpoint
// @route   POST /api/v1/admin/logout
exports.adminLogout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Admin session terminated successfully',
  });
};

// @desc    Verify current admin token
// @route   GET /api/v1/admin/verify
exports.verifyAdminSession = async (req, res) => {
  return res.status(200).json({
    success: true,
    admin: req.admin,
    message: 'Admin session is active and valid',
  });
};

// @desc    Get dashboard analytics & statistics
// @route   GET /api/v1/admin/stats
exports.getAdminStats = async (req, res, next) => {
  try {
    const now = new Date();
    const lastYear = now.getFullYear() - 1;
    const startOfLastYear = new Date(lastYear, 0, 1);
    const endOfLastYear = new Date(lastYear, 11, 31, 23, 59, 59);

    const COMPLETED_STATUSES = ['Delivered', 'Completed'];

    // Revenue and per-status counts are computed by the database in a single
    // aggregation pass. The previous version pulled every order document into
    // Node just to sum `total`, which grew linearly with the order history.
    const revenueAgg = Order.aggregate([
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$total' },
                totalOrders: { $sum: 1 },
                completedOrders: {
                  $sum: { $cond: [{ $in: ['$orderStatus', COMPLETED_STATUSES] }, 1, 0] },
                },
                pendingOrders: {
                  $sum: { $cond: [{ $eq: ['$orderStatus', 'Processing'] }, 1, 0] },
                },
              },
            },
          ],
          lastYear: [
            { $match: { createdAt: { $gte: startOfLastYear, $lte: endOfLastYear } } },
            {
              $group: {
                _id: null,
                lastYearRevenue: { $sum: '$total' },
                lastYearTotalOrders: { $sum: 1 },
                lastYearCompletedOrders: {
                  $sum: { $cond: [{ $in: ['$orderStatus', COMPLETED_STATUSES] }, 1, 0] },
                },
              },
            },
          ],
        },
      },
    ]);

    // Independent queries — issued in parallel rather than one after another
    const [aggResult, totalProducts, totalCustomers, recentOrders] = await Promise.all([
      revenueAgg,
      Product.estimatedDocumentCount(),
      User.countDocuments({ role: 'customer' }),
      Order.find()
        .select('orderId user total orderStatus paymentStatus paymentMethod createdAt')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const overall = aggResult[0]?.overall[0] || {};
    const lastYearStats = aggResult[0]?.lastYear[0] || {};

    res.json({
      success: true,
      data: {
        totalRevenue: overall.totalRevenue || 0,
        totalOrders: overall.totalOrders || 0,
        totalProducts,
        totalCustomers,
        pendingOrders: overall.pendingOrders || 0,
        completedOrders: overall.completedOrders || 0,
        lastYearRevenue: lastYearStats.lastYearRevenue || 0,
        lastYearTotalOrders: lastYearStats.lastYearTotalOrders || 0,
        lastYearCompletedOrders: lastYearStats.lastYearCompletedOrders || 0,
        recentOrders,
      },
      message: 'Admin statistics retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders for admin timeline
// @route   GET /api/v1/admin/orders
exports.getAdminOrders = async (req, res, next) => {
  try {
    // `.lean()` returns plain objects — no Mongoose document wrapper per order/item.
    // Backed by the { createdAt: -1 } index so the sort no longer happens in memory.
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({
      success: true,
      data: orders,
      message: 'All orders fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/v1/admin/orders/:id/status
exports.updateAdminOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    if (!orderStatus) {
      return res.status(400).json({ success: false, message: 'Please provide orderStatus' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = orderStatus;
    if (orderStatus === 'Delivered' || orderStatus === 'Completed') {
      order.deliveredAt = Date.now();
    }

    await order.save();

    res.json({
      success: true,
      data: order,
      message: `Order status updated to ${orderStatus}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin product list
// @route   GET /api/v1/admin/products
exports.getAdminProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'name slug icon')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: products,
      message: 'Products catalog retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

function sanitizeSections(sections) {
  if (!Array.isArray(sections)) return [];

  return sections.map((sec, secIdx) => {
    const rawItems = Array.isArray(sec.items) ? sec.items : [];
    const sanitizedItems = rawItems
      .filter((item) => item && (item.label?.trim() || item.value?.trim()))
      .slice(0, 20)
      .map((item, iIdx) => ({
        label: item.label ? item.label.trim() : '',
        value: item.value ? item.value.trim() : '',
        order: typeof item.order === 'number' ? item.order : iIdx,
      }));

    return {
      title: sec.title ? sec.title.trim() : 'Section',
      type: ['specifications', 'keyFeatures', 'details', 'table', 'list', 'text'].includes(sec.type)
        ? sec.type
        : 'table',
      items: sanitizedItems,
      content: sec.content ? sec.content.trim() : '',
      order: typeof sec.order === 'number' ? sec.order : secIdx,
    };
  });
}

// @desc    Create product (admin)
// @route   POST /api/v1/admin/products
exports.createAdminProduct = async (req, res, next) => {
  try {
    if (req.body.sections) {
      req.body.sections = sanitizeSections(req.body.sections);
    }
    req.body.category = await resolveCategoryId(req.body.category);
    const product = await Product.create(req.body);

    cache.invalidate('products:', 'product:');

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (admin)
// @route   PUT /api/v1/admin/products/:id
exports.updateAdminProduct = async (req, res, next) => {
  try {
    // Only the category field is needed for the existence check — fetch just that
    // instead of hydrating the whole document (including its `sections` array).
    const existing = await Product.findById(req.params.id).select('category').lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (req.body.sections) {
      req.body.sections = sanitizeSections(req.body.sections);
    }

    if (req.body.category || !existing.category) {
      req.body.category = await resolveCategoryId(req.body.category);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    cache.invalidate('products:', 'product:');

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Delete product (admin)
// @route   DELETE /api/v1/admin/products/:id
exports.deleteAdminProduct = async (req, res, next) => {
  try {
    // Single round trip — findByIdAndDelete already reports whether it matched
    const product = await Product.findByIdAndDelete(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    cache.invalidate('products:', 'product:');

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin categories
// @route   GET /api/v1/admin/categories
exports.getAdminCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json({
      success: true,
      data: categories,
      message: 'Categories fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create admin category
// @route   POST /api/v1/admin/categories
exports.createAdminCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const nameTrimmed = name.trim();
    const slug = nameTrimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existing = await Category.findOne({ $or: [{ name: nameTrimmed }, { slug }] });
    if (existing) {
      return res.status(200).json({
        success: true,
        data: existing,
        message: 'Category already exists',
      });
    }

    const category = await Category.create({
      name: nameTrimmed,
      slug,
      description: description || '',
      icon: icon || 'Tag',
    });

    cache.invalidate('categories:', 'products:');

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete admin category
// @route   DELETE /api/v1/admin/categories/:id
exports.deleteAdminCategory = async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    cache.invalidate('categories:', 'products:');
    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated, searchable, sortable list of customers for admin panel
// @route   GET /api/v1/admin/users
exports.getAdminUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, sort } = req.query;

    const query = { role: { $ne: 'admin' } };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobileNumber: searchRegex },
      ];
    }

    let sortOptions = { createdAt: -1 }; // default: joined_desc
    if (sort === 'joined_asc') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'name_asc') {
      sortOptions = { name: 1 };
    } else if (sort === 'name_desc') {
      sortOptions = { name: -1 };
    } else if (sort === 'last_login_desc') {
      sortOptions = { lastLoginAt: -1 };
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -refreshTokens -emailOtpHash -phoneOtpHash')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: {
        users,
        page,
        pages: Math.ceil(total / limit) || 1,
        total,
      },
      message: 'Users fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};
