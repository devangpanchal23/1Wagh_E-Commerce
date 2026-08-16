const Order = require('../models/Order');
const PaymentReceipt = require('../models/PaymentReceipt');

const COMPANY_DETAILS = {
  name: process.env.COMPANY_NAME || 'Wagh Mobile Accessories',
  gstin: process.env.COMPANY_GSTIN || '27AAACW1234A1Z5',
  email: process.env.COMPANY_EMAIL || 'support@waghmobile.com',
  phone: process.env.COMPANY_PHONE || '+91 98765 43210',
  address: process.env.COMPANY_ADDRESS || 'Wagh Mobile Accessories, Main Market, Mumbai, MH - 400001',
};

// Helper to generate sequential-style receipt number
function generateReceiptNumber(orderRef) {
  const timestamp = Date.now().toString().slice(-6);
  const cleanId = (orderRef || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `WAG-PAY-${new Date().getFullYear()}-${cleanId || timestamp}`;
}

// Get Payment Receipt (Financial Record)
exports.getPaymentReceipt = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      $or: [
        { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
        { orderNumber: orderId },
        { orderId: orderId },
      ].filter(Boolean),
    }).populate('user', 'name email mobileNumber').lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to payment receipt' });
    }

    const displayOrderId = order.orderNumber || order.orderId;

    // Retrieve or auto-create PaymentReceipt record
    let receipt = await PaymentReceipt.findOne({ order: order._id }).lean();

    if (!receipt) {
      const receiptNumber = generateReceiptNumber(displayOrderId);
      const subtotal = order.subtotal || order.total || 0;
      const gstAmount = order.gstAmount || Math.round(subtotal * 0.18 * 100) / 100;
      const cgst = order.gstBreakdown?.cgst || Math.round((gstAmount / 2) * 100) / 100;
      const sgst = order.gstBreakdown?.sgst || Math.round((gstAmount / 2) * 100) / 100;

      const paymentDate = order.createdAt || new Date();
      const paymentTime = new Date(paymentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      receipt = await PaymentReceipt.create({
        receiptNumber,
        order: order._id,
        orderIdString: displayOrderId,
        user: order.user._id,
        paymentDate,
        paymentTime,
        paymentMode: order.paymentMethod || 'COD',
        gatewayTransactionId: order.razorpayPaymentId || order.razorpayOrderId || (order.paymentMethod === 'COD' ? 'COD-' + displayOrderId : 'N/A'),
        subtotal,
        gstAmount,
        gstBreakdown: { cgst, sgst, igst: 0 },
        totalAmountPaid: order.total,
        status: order.paymentStatus === 'Paid' ? 'Success' : 'Pending',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment receipt fetched successfully',
      data: {
        receiptNumber: receipt.receiptNumber,
        orderId: displayOrderId,
        paymentDate: receipt.paymentDate,
        paymentTime: receipt.paymentTime,
        paymentMode: receipt.paymentMode,
        gatewayTransactionId: receipt.gatewayTransactionId,
        paymentStatus: receipt.status,
        company: COMPANY_DETAILS,
        customer: {
          name: order.user?.name || order.shippingAddress?.name || 'Customer',
          email: order.user?.email || '',
          phone: order.shippingAddress?.phone || order.user?.mobileNumber || '',
        },
        financialBreakdown: {
          subtotal: receipt.subtotal,
          gstAmount: receipt.gstAmount,
          gstBreakdown: receipt.gstBreakdown,
          totalAmountPaid: receipt.totalAmountPaid,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Product Purchase Invoice (Tax Invoice)
exports.getPurchaseInvoice = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      $or: [
        { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
        { orderNumber: orderId },
        { orderId: orderId },
      ].filter(Boolean),
    }).populate('user', 'name email mobileNumber').lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to purchase invoice' });
    }

    const displayOrderId = order.orderNumber || order.orderId;
    const subtotal = order.subtotal || 0;
    const shippingFee = order.shippingFee || 0;
    const discount = order.couponDiscount || order.discount || 0;
    const gstAmount = order.gstAmount || Math.round((subtotal - discount) * 0.18 * 100) / 100;
    const cgst = order.gstBreakdown?.cgst || Math.round((gstAmount / 2) * 100) / 100;
    const sgst = order.gstBreakdown?.sgst || Math.round((gstAmount / 2) * 100) / 100;
    const invoiceNumber = `INV-${displayOrderId}-${new Date(order.createdAt).getFullYear()}`;

    // Itemized lines
    const lineItems = (order.items || []).map((item, idx) => ({
      srNo: idx + 1,
      name: item.name,
      sku: item.sku || `WAGH-SKU-${(item.product || '').toString().slice(-6).toUpperCase()}`,
      qty: item.qty,
      unitPrice: item.price,
      lineTotal: item.price * item.qty,
      image: item.image,
    }));

    res.status(200).json({
      success: true,
      message: 'Purchase invoice fetched successfully',
      data: {
        invoiceNumber,
        invoiceDate: order.createdAt,
        orderId: displayOrderId,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        transactionId: order.razorpayPaymentId || order.razorpayOrderId || (order.paymentMethod === 'COD' ? 'COD-' + displayOrderId : 'N/A'),
        lineItems,
        summary: {
          subtotal,
          shippingFee,
          discount,
          gstAmount,
          gstBreakdown: { cgst, sgst, igst: 0 },
          grandTotal: order.total,
        },
        shippingAddress: order.shippingAddress,
        customer: {
          name: order.user?.name || order.shippingAddress?.name || 'Customer',
          email: order.user?.email || '',
          phone: order.shippingAddress?.phone || order.user?.mobileNumber || '',
        },
        company: COMPANY_DETAILS,
      },
    });
  } catch (error) {
    next(error);
  }
};
