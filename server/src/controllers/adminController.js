const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const AdminConfig = require('../models/AdminConfig');
const { resolveCategoryId } = require('../utils/categoryResolver');
const cache = require('../utils/cache');
const { buildXlsxBuffer, XLSX_CONTENT_TYPE } = require('../utils/xlsxWriter');

// Helper to get or lazy-seed AdminConfig document in MongoDB
const getOrInitAdminConfig = async () => {
  let config = await AdminConfig.findOne();
  if (!config) {
    const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
    const envHash = process.env.ADMIN_PASSWORD_HASH;
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin2026';

    let hashToUse = envHash;
    if (!hashToUse) {
      hashToUse = await bcrypt.hash(defaultPassword, 10);
    }

    config = await AdminConfig.create({
      username: defaultUsername,
      passwordHash: hashToUse,
    });
  }
  return config;
};

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

    const config = await getOrInitAdminConfig();

    if (username.trim() !== config.username) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin username or password',
      });
    }

    let isMatch = await bcrypt.compare(password.trim(), config.passwordHash);

    // Fallback check against plain env password if initial seed hash didn't match
    if (!isMatch && process.env.ADMIN_PASSWORD) {
      isMatch = password.trim() === process.env.ADMIN_PASSWORD.trim();
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
        username: config.username,
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
        username: config.username,
        role: 'admin',
      },
      message: 'Admin authentication successful',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin username and/or password
// @route   PUT /api/v1/admin/credentials
exports.updateAdminCredentials = async (req, res, next) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required to authorize credential changes',
      });
    }

    const config = await getOrInitAdminConfig();

    // Verify current password first
    let isMatch = await bcrypt.compare(currentPassword.trim(), config.passwordHash);
    if (!isMatch && process.env.ADMIN_PASSWORD) {
      isMatch = currentPassword.trim() === process.env.ADMIN_PASSWORD.trim();
    }

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect. Credential update denied.',
      });
    }

    let updated = false;

    // Update username if provided
    if (newUsername && newUsername.trim()) {
      if (newUsername.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'New admin username must be at least 3 characters long',
        });
      }
      config.username = newUsername.trim();
      updated = true;
    }

    // Update password if provided
    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        return res.status(400).json({
          success: false,
          message: 'New admin password must be at least 4 characters long',
        });
      }
      config.passwordHash = await bcrypt.hash(newPassword.trim(), 10);
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new username or new password to update',
      });
    }

    await config.save();

    // Re-issue JWT token with updated admin info
    const adminSecret = process.env.ADMIN_JWT_SECRET || 'wagh_admin_dedicated_jwt_secret_key_2026_secure';
    const newToken = jwt.sign(
      {
        username: config.username,
        role: 'admin',
        type: 'admin_session',
      },
      adminSecret,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      success: true,
      token: newToken,
      admin: {
        username: config.username,
        role: 'admin',
      },
      message: 'Admin credentials updated successfully!',
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

// @desc    Bulk delete selected products (admin)
// @route   POST /api/v1/admin/products/bulk-delete
exports.bulkDeleteAdminProducts = async (req, res, next) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one product to delete',
      });
    }

    try {
      const mockData = require('../utils/mockData');
      if (Array.isArray(mockData.mockProducts) && mockData.mockProducts.length > 0) {
        for (let i = mockData.mockProducts.length - 1; i >= 0; i--) {
          if (productIds.includes(String(mockData.mockProducts[i]._id))) {
            mockData.mockProducts.splice(i, 1);
          }
        }
      }
    } catch (_) {}

    const validObjectIds = productIds
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const result = await Product.deleteMany({
      $or: [
        { _id: { $in: validObjectIds } },
        { _id: { $in: productIds } },
      ],
    });

    cache.invalidate('products:', 'product:');

    res.json({
      success: true,
      deletedCount: result.deletedCount || 0,
      message: `${result.deletedCount || productIds.length} products deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete ALL products from catalog (admin)
// @route   DELETE /api/v1/admin/products/all
exports.deleteAllAdminProducts = async (req, res, next) => {
  try {
    try {
      const mockData = require('../utils/mockData');
      if (Array.isArray(mockData.mockProducts)) {
        mockData.mockProducts.length = 0;
      }
    } catch (_) {}

    const result = await Product.deleteMany({});

    cache.invalidate('products:', 'product:');

    res.json({
      success: true,
      deletedCount: result.deletedCount || 0,
      message: 'All products deleted from catalog successfully',
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

// Escape regex metacharacters so a search term like "a+(" is matched literally
// instead of compiling into a pattern that can throw or backtrack pathologically.
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Shared between the paginated customer list and the Excel export so both views
// always agree on which accounts are considered customers.
const buildCustomerQuery = (search) => {
  const query = { role: { $ne: 'admin' } };

  if (search && search.trim()) {
    const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { mobileNumber: searchRegex },
    ];
  }

  return query;
};

const resolveCustomerSort = (sort) => {
  if (sort === 'joined_asc') return { createdAt: 1 };
  if (sort === 'name_asc') return { name: 1 };
  if (sort === 'name_desc') return { name: -1 };
  if (sort === 'last_login_desc') return { lastLoginAt: -1 };
  return { createdAt: -1 }; // default: joined_desc
};

// @desc    Get paginated, searchable, sortable list of customers for admin panel
// @route   GET /api/v1/admin/users
exports.getAdminUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, sort } = req.query;

    const query = buildCustomerQuery(search);
    const sortOptions = resolveCustomerSort(sort);

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

// Guard against a single request trying to stream an unbounded collection into
// memory on a serverless function. Comfortably above any realistic customer base.
const USER_EXPORT_ROW_LIMIT = 25000;

const GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

// @desc    Export all registered customers (name, phone, DOB, gender, email) as .xlsx
// @route   GET /api/v1/admin/users/export
exports.exportAdminUsers = async (req, res, next) => {
  try {
    const { search, sort } = req.query;

    // Reuse the list endpoint's filter/sort so the download always matches what
    // the admin currently sees in the Customers table.
    const query = buildCustomerQuery(search);
    const sortOptions = resolveCustomerSort(sort);

    const users = await User.find(query)
      .select('name email mobileNumber birthdate gender')
      .sort(sortOptions)
      .limit(USER_EXPORT_ROW_LIMIT)
      .lean();

    const rows = users.map((user) => ({
      name: (user.name || '').trim(),
      phone: (user.mobileNumber || '').trim(),
      birthdate: (user.birthdate || '').trim(),
      gender: GENDER_LABELS[user.gender] || '',
      email: (user.email || '').trim(),
    }));

    const workbook = buildXlsxBuffer({
      sheetName: 'WAGH Customers',
      headerColor: 'FF0D5C52', // wagh-teal, matching the admin panel
      columns: [
        { header: 'Name', key: 'name', width: 28 },
        { header: 'Phone Number', key: 'phone', width: 18 },
        { header: 'Date of Birth', key: 'birthdate', width: 16, type: 'date' },
        { header: 'Gender', key: 'gender', width: 18 },
        { header: 'Email Address', key: 'email', width: 34 },
      ],
      rows,
    });

    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `wagh-customers-${stamp}.xlsx`;

    res.setHeader('Content-Type', XLSX_CONTENT_TYPE);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', workbook.length);
    res.setHeader('Cache-Control', 'no-store');
    // Surfaced to the client so it can report how many rows were downloaded
    res.setHeader('X-Total-Records', String(rows.length));

    return res.status(200).end(workbook);
  } catch (error) {
    next(error);
  }
};
