const Subscriber = require('../models/Subscriber');
const Contact = require('../models/Contact');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

exports.subscribeNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    let sub = await Subscriber.findOne({ email });
    if (sub) {
      return res.json({ success: true, message: 'You are already subscribed to the WAGH insider list!' });
    }

    sub = await Subscriber.create({ email });
    res.status(201).json({
      success: true,
      data: sub,
      message: 'Thank you for subscribing to WAGH insider!'
    });
  } catch (error) {
    next(error);
  }
};

exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    }

    const contact = await Contact.create({ name, email, phone, subject, message });
    res.status(201).json({
      success: true,
      data: contact,
      message: 'Message sent successfully! Our team will contact you shortly.'
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const completedOrders = await Order.countDocuments({ orderStatus: { $in: ['Delivered', 'Completed'] } });
    
    const allOrders = await Order.find();
    const totalRevenue = allOrders.reduce((acc, item) => acc + (item.total || 0), 0);

    // Calculate Last Year Sales and Completed Orders
    const now = new Date();
    const lastYear = now.getFullYear() - 1;
    const startOfLastYear = new Date(lastYear, 0, 1);
    const endOfLastYear = new Date(lastYear, 11, 31, 23, 59, 59);

    const lastYearOrders = allOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= startOfLastYear && d <= endOfLastYear;
    });

    const lastYearRevenue = lastYearOrders.reduce((acc, item) => acc + (item.total || 0), 0);
    const lastYearCompletedOrders = lastYearOrders.filter(o => o.orderStatus === 'Delivered' || o.orderStatus === 'Completed').length;

    const pendingOrders = await Order.countDocuments({ orderStatus: 'Processing' });
    const recentOrders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
        pendingOrders,
        completedOrders,
        lastYearRevenue,
        lastYearTotalOrders: lastYearOrders.length,
        lastYearCompletedOrders,
        recentOrders,
      },
      message: 'Admin stats retrieved'
    });
  } catch (error) {
    next(error);
  }
};
