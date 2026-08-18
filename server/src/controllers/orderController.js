const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const PaymentReceipt = require('../models/PaymentReceipt');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { generateOrderNumber } = require('../utils/generateOrderNumber');

async function rollbackStock(items) {
  for (const item of items) {
    try {
      if (item.hasVariants && item.sku) {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { 'variants.$[v].sizes.$[s].stock': item.qty } },
          { arrayFilters: [{ 'v.sizes.sku': item.sku }, { 's.sku': item.sku }] }
        );
      } else {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stock: item.qty } }
        );
      }
    } catch (err) {
      console.error('Stock rollback error:', err);
    }
  }
}

exports.createOrder = async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      shippingFee = 0,
      couponCode,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    // Server-side subtotal calculation & image sanitization
    let calculatedSubtotal = 0;
    const sanitizedItems = items.map((item) => {
      const rawImg = item.image || item.product?.images?.[0] || '';
      const imgUrl = typeof rawImg === 'string' ? rawImg : (rawImg?.url || '');

      const productIdStr = item.product?._id ? item.product._id.toString() : (item.product || item.productId || '').toString();

      return {
        ...item,
        product: productIdStr,
        image: imgUrl,
        price: Number(item.price),
        qty: Number(item.qty),
        sku: item.sku || '',
        variantId: item.variantId || null,
        colorName: item.colorName || '',
        sizeLabel: item.sizeLabel || '',
      };
    });

    for (const item of sanitizedItems) {
      if (!item.price || !item.qty) {
        return res.status(400).json({ success: false, message: 'Invalid item price or quantity' });
      }
      calculatedSubtotal += item.price * item.qty;
    }

    // Perform ATOMIC stock decrement before finalizing order
    const decrementedItems = [];
    for (const item of sanitizedItems) {
      const pDoc = await Product.findById(item.product).lean();
      if (!pDoc) {
        await rollbackStock(decrementedItems);
        return res.status(400).json({ success: false, message: `Product not found for item '${item.name}'` });
      }

      let updated = null;
      if (pDoc.hasVariants && item.sku) {
        updated = await Product.findOneAndUpdate(
          {
            _id: item.product,
            'variants.sizes.sku': item.sku,
            'variants.sizes.stock': { $gte: item.qty }
          },
          {
            $inc: { 'variants.$[v].sizes.$[s].stock': -item.qty }
          },
          {
            arrayFilters: [
              { 'v.sizes.sku': item.sku },
              { 's.sku': item.sku }
            ],
            new: true
          }
        );
      } else {
        updated = await Product.findOneAndUpdate(
          {
            _id: item.product,
            stock: { $gte: item.qty }
          },
          {
            $inc: { stock: -item.qty }
          },
          { new: true }
        );
      }

      if (!updated) {
        await rollbackStock(decrementedItems);
        const label = item.name || (pDoc.name + (item.sizeLabel ? ` (${item.colorName} / ${item.sizeLabel})` : ''));
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${label}'. Please update your cart.`
        });
      }

      decrementedItems.push({
        productId: item.product,
        sku: item.sku,
        qty: item.qty,
        hasVariants: pDoc.hasVariants,
      });
    }

    // Coupon re-validation, per-user check, discount calculation, and ATOMIC consumption
    let appliedCouponCode = '';
    let calculatedDiscount = 0;
    let couponToConsumeId = null;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const codeUpper = couponCode.trim().toUpperCase();
      const now = new Date();

      const coupon = await Coupon.findOne({ code: codeUpper });

      if (!coupon) {
        return res.status(400).json({ success: false, message: `Coupon '${codeUpper}' not found.` });
      }

      if (coupon.status !== 'published') {
        return res.status(400).json({ success: false, message: `Coupon '${codeUpper}' is not active.` });
      }

      if (now > new Date(coupon.expiryDate)) {
        return res.status(400).json({ success: false, message: `Coupon '${codeUpper}' has expired.` });
      }

      // Check total overall usage limit
      if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
        return res.status(400).json({ success: false, message: `Total redemption limit for coupon '${codeUpper}' has been reached.` });
      }

      // Check per-user limit
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

      if (calculatedSubtotal < coupon.minCartValue) {
        return res.status(400).json({
          success: false,
          message: `Cart total must reach ₹${coupon.minCartValue} to use coupon '${coupon.code}'.`,
        });
      }

      // Authoritative discount calculation
      if (coupon.discountType === 'percentage') {
        calculatedDiscount = (calculatedSubtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountCap && coupon.maxDiscountCap > 0) {
          calculatedDiscount = Math.min(calculatedDiscount, coupon.maxDiscountCap);
        }
      } else if (coupon.discountType === 'flat') {
        calculatedDiscount = coupon.discountValue;
      }
      calculatedDiscount = Math.min(calculatedDiscount, calculatedSubtotal);

      appliedCouponCode = coupon.code;
      couponToConsumeId = coupon._id;
    }

    const netSubtotal = Math.max(0, calculatedSubtotal - calculatedDiscount);

    // GST Calculation: 18% standard rate included/added on net subtotal
    const gstAmount = Math.round((netSubtotal * 0.18) * 100) / 100;
    const cgst = Math.round((gstAmount / 2) * 100) / 100;
    const sgst = Math.round((gstAmount / 2) * 100) / 100;

    const finalTotal = Math.round((netSubtotal + Number(shippingFee)) * 100) / 100;
    const orderIdStr = 'WAGH-' + Math.floor(100000 + Math.random() * 900000);
    const orderNumber = await generateOrderNumber();

    const isPaid = paymentMethod === 'Razorpay' || (razorpayPaymentId ? true : false);

    const order = await Order.create({
      user: req.user._id,
      orderId: orderIdStr,
      orderNumber,
      items: sanitizedItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: isPaid ? 'Paid' : 'Pending',
      subtotal: Math.round(calculatedSubtotal * 100) / 100,
      shippingFee: Number(shippingFee) || 0,
      discount: Math.round(calculatedDiscount * 100) / 100,
      couponCode: appliedCouponCode,
      couponDiscount: Math.round(calculatedDiscount * 100) / 100,
      gstAmount,
      gstBreakdown: { cgst, sgst, igst: 0 },
      total: finalTotal,
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      razorpaySignature: razorpaySignature || '',
    });

    // Atomically consume/increment coupon usage AFTER successful order creation
    if (couponToConsumeId && req.user?._id) {
      const userId = req.user._id;
      const incResult = await Coupon.findOneAndUpdate(
        {
          _id: couponToConsumeId,
          'usedBy.user': userId,
        },
        {
          $inc: { usageCount: 1, 'usedBy.$.count': 1 },
          $set: { 'usedBy.$.lastUsedAt': new Date() },
        },
        { new: true }
      );

      if (!incResult) {
        await Coupon.findOneAndUpdate(
          {
            _id: couponToConsumeId,
          },
          {
            $inc: { usageCount: 1 },
            $push: { usedBy: { user: userId, count: 1, lastUsedAt: new Date() } },
          },
          { new: true }
        );
      }
    }

    // Auto-create initial PaymentReceipt
    const receiptNumber = `WAG-PAY-${new Date().getFullYear()}-${orderIdStr.replace('WAGH-', '')}`;
    const paymentDate = order.createdAt || new Date();
    const paymentTime = new Date(paymentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    await PaymentReceipt.create({
      receiptNumber,
      order: order._id,
      orderIdString: order.orderId,
      user: req.user._id,
      paymentDate,
      paymentTime,
      paymentMode: order.paymentMethod,
      gatewayTransactionId: razorpayPaymentId || razorpayOrderId || (order.paymentMethod === 'COD' ? `COD-${order.orderId}` : 'N/A'),
      subtotal: order.subtotal,
      gstAmount,
      gstBreakdown: { cgst, sgst, igst: 0 },
      couponCode: appliedCouponCode,
      couponDiscountAmount: calculatedDiscount,
      finalAmountPaid: order.total,
      paymentStatus: isPaid ? 'Success' : 'Pending',
    });

    // Clear user cart after placing order
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order placed successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .select('orderId items shippingAddress paymentMethod paymentStatus orderStatus subtotal shippingFee discount couponCode couponDiscount gstAmount total createdAt razorpayPaymentId razorpayOrderId')
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      success: true,
      data: orders,
      message: 'Orders fetched',
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    res.json({
      success: true,
      data: order,
      message: 'Order details fetched',
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({
      success: true,
      data: orders,
      message: 'All orders fetched',
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update order status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      // Sync PaymentReceipt status if updated to Paid
      if (paymentStatus === 'Paid') {
        await PaymentReceipt.findOneAndUpdate(
          { order: order._id },
          { paymentStatus: 'Success' }
        );
      }
    }

    await order.save();
    res.json({
      success: true,
      data: order,
      message: 'Order status updated',
    });
  } catch (error) {
    next(error);
  }
};

// Create Razorpay Order (Backend Step 1)
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount provided' });
    }

    const amountInPaise = Math.round(numAmount * 100);

    if (amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least 100 paise (₹1)',
      });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay credentials not configured in server environment',
      });
    }

    const instance = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };

    const razorpayOrder = await instance.orders.create(options);

    res.status(200).json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: key_id,
      data: razorpayOrder,
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Razorpay order creation failed',
    });
  }
};

// Verify Razorpay Signature (Backend Step 3)
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)',
      });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay secret key not configured on server',
      });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // If an existing order ID was provided, update it directly
      if (orderId) {
        const order = await Order.findOne({
          $or: [{ _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }, { orderId: orderId }],
        });

        if (order) {
          order.paymentStatus = 'Paid';
          order.razorpayOrderId = razorpay_order_id;
          order.razorpayPaymentId = razorpay_payment_id;
          order.razorpaySignature = razorpay_signature;
          await order.save();

          await PaymentReceipt.findOneAndUpdate(
            { order: order._id },
            {
              gatewayTransactionId: razorpay_payment_id,
              paymentStatus: 'Success',
            }
          );
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Razorpay payment signature verified successfully',
        razorpay_order_id,
        razorpay_payment_id,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay signature. Payment verification failed.',
      });
    }
  } catch (error) {
    console.error('Razorpay Verification Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Razorpay payment verification failed',
    });
  }
};
