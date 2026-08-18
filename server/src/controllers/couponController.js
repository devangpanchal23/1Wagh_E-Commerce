const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper function to calculate server-side authoritative cart total
async function calculateCartTotal(req) {
  const { items, cartTotal, subtotal } = req.body;

  // 1. Calculate from submitted items array using authoritative DB product prices
  if (items && Array.isArray(items) && items.length > 0) {
    const productIds = items
      .map(item => item.product?._id || item.product?.id || item.product || item.productId)
      .filter(Boolean);

    if (productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } }).lean();
      const productMap = new Map(products.map(p => [p._id.toString(), p.price]));

      let total = 0;
      for (const item of items) {
        const pId = (item.product?._id || item.product?.id || item.product || item.productId || '').toString();
        const officialPrice = productMap.get(pId) || Number(item.price) || 0;
        const qty = Number(item.qty) || 1;
        total += officialPrice * qty;
      }

      if (total > 0) return total;
    }
  }

  // 2. Query MongoDB Cart collection if authenticated user is present
  if (req.user?._id) {
    const cart = await Cart.findOne({ user: req.user._id }).lean();
    if (cart && cart.items && cart.items.length > 0) {
      const productIds = cart.items.map(item => item.product).filter(Boolean);
      const products = await Product.find({ _id: { $in: productIds } }).lean();
      const productMap = new Map(products.map(p => [p._id.toString(), p.price]));

      let total = 0;
      for (const item of cart.items) {
        const price = productMap.get(item.product.toString()) || item.priceAtAdd || 0;
        total += price * (item.qty || 1);
      }
      if (total > 0) return total;
    }
  }

  // 3. Fallback to client-submitted subtotal/cartTotal hint
  const fallbackVal = Number(cartTotal || subtotal || 0);
  if (!isNaN(fallbackVal) && fallbackVal > 0) {
    return fallbackVal;
  }

  return 0;
}

// Client: Apply coupon to cart
exports.applyCoupon = async (req, res, next) => {
  try {
    const { couponCode } = req.body;

    if (!couponCode || typeof couponCode !== 'string' || !couponCode.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid coupon code.' });
    }

    const codeUpper = couponCode.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: codeUpper });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon code not found.' });
    }

    if (coupon.status !== 'published') {
      return res.status(400).json({ success: false, message: 'This coupon is not currently active.' });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ success: false, message: 'This coupon code has expired.' });
    }

    // Total Overall Usage Limit check
    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Total coupon redemption limit has been reached.' });
    }

    // Per-User Usage Limit check
    if (req.user?._id) {
      const userUsage = coupon.usedBy?.find(u => u.user && u.user.toString() === req.user._id.toString());
      const timesUsed = userUsage ? userUsage.count : 0;
      const userLimit = coupon.usageLimitPerUser !== null && coupon.usageLimitPerUser !== undefined ? coupon.usageLimitPerUser : 1;

      if (timesUsed >= userLimit) {
        return res.status(400).json({
          success: false,
          message: `You have already redeemed coupon '${coupon.code}' your maximum allowed limit of ${userLimit} time${userLimit > 1 ? 's' : ''}.`,
        });
      }
    }

    // Server-side authoritative cart calculation
    const cartTotal = await calculateCartTotal(req);

    if (cartTotal < coupon.minCartValue) {
      const shortfall = coupon.minCartValue - cartTotal;
      return res.status(400).json({
        success: false,
        message: `Cart total must reach ₹${coupon.minCartValue.toLocaleString('en-IN')} to unlock code ${coupon.code}. Add ₹${shortfall.toLocaleString('en-IN')} more to your cart!`,
        minCartValue: coupon.minCartValue,
        shortfall,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountCap && coupon.maxDiscountCap > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountCap);
      }
    } else if (coupon.discountType === 'flat') {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, cartTotal);
    const finalTotal = Math.max(0, cartTotal - discountAmount);

    res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully!`,
      data: {
        couponCode: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100,
        cartTotal,
        finalTotal: Math.round(finalTotal * 100) / 100,
        minCartValue: coupon.minCartValue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper to parse date and ensure date-only strings (e.g. "2026-08-20") cover through end-of-day (23:59:59.999Z)
function parseExpiryDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;

  const str = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T23:59:59.999Z`);
  }
  return new Date(dateInput);
}

// Admin: Create new coupon (defaults to draft)
exports.createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minCartValue,
      maxDiscountCap,
      expiryDate,
      usageLimit,
      usageLimitPerUser,
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Code, discountType, discountValue, and expiryDate are required.',
      });
    }

    const codeUpper = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: codeUpper });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon with code '${codeUpper}' already exists.` });
    }

    const parsedExpiry = parseExpiryDate(expiryDate);
    if (!parsedExpiry || isNaN(parsedExpiry.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid expiry date format.' });
    }

    const coupon = await Coupon.create({
      code: codeUpper,
      discountType,
      discountValue: Number(discountValue),
      minCartValue: Number(minCartValue || 0),
      maxDiscountCap: maxDiscountCap ? Number(maxDiscountCap) : null,
      expiryDate: parsedExpiry,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      usageLimitPerUser: usageLimitPerUser ? Number(usageLimitPerUser) : 1,
      status: 'draft',
      createdBy: req.user?._id || req.admin?.id || null,
    });

    res.status(201).json({
      success: true,
      data: coupon,
      message: `Coupon '${coupon.code}' created as draft.`,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all coupons
exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
      data: coupons,
      message: 'Coupons retrieved successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update coupon
exports.updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code,
      discountType,
      discountValue,
      minCartValue,
      maxDiscountCap,
      expiryDate,
      usageLimit,
      usageLimitPerUser,
    } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    if (code) coupon.code = code.trim().toUpperCase();
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (minCartValue !== undefined) coupon.minCartValue = Number(minCartValue);
    if (maxDiscountCap !== undefined) coupon.maxDiscountCap = maxDiscountCap ? Number(maxDiscountCap) : null;
    if (expiryDate) {
      const parsedExpiry = parseExpiryDate(expiryDate);
      if (!parsedExpiry || isNaN(parsedExpiry.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid expiry date format.' });
      }
      coupon.expiryDate = parsedExpiry;
    }
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit ? Number(usageLimit) : null;
    if (usageLimitPerUser !== undefined) coupon.usageLimitPerUser = Number(usageLimitPerUser) || 1;

    await coupon.save();

    res.status(200).json({
      success: true,
      data: coupon,
      message: `Coupon '${coupon.code}' updated successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Publish coupon
exports.publishCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    coupon.status = 'published';
    await coupon.save();

    res.status(200).json({
      success: true,
      data: coupon,
      message: `Coupon '${coupon.code}' is now published and live!`,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Unpublish coupon
exports.unpublishCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    coupon.status = 'draft';
    await coupon.save();

    res.status(200).json({
      success: true,
      data: coupon,
      message: `Coupon '${coupon.code}' reverted to draft.`,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete coupon
exports.deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' deleted.`,
    });
  } catch (error) {
    next(error);
  }
};
