const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const envPath = fs.existsSync(path.join(__dirname, '../.env'))
  ? path.join(__dirname, '../.env')
  : fs.existsSync(path.join(__dirname, '../env'))
    ? path.join(__dirname, '../env')
    : null;

if (envPath) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const { connectDB, ensureDBConnection, mongoose } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const brandRoutes = require('./routes/brandRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const googleDriveRoutes = require('./routes/googleDriveRoutes');
const githubRoutes = require('./routes/githubRoutes');
const extraRoutes = require('./routes/extraRoutes');
const couponRoutes = require('./routes/couponRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust the proxy so rate limiting and protocol detection work behind Vercel/Nginx
app.set('trust proxy', 1);

// Strong ETags let browsers revalidate with a 304 (empty body) instead of
// re-downloading an unchanged product list.
app.set('etag', 'strong');

// Security headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// Gzip every JSON response above 1KB. Product listings are image-URL heavy and
// compress by roughly 70-85%, which is the single biggest win on slow networks.
app.use(compression({ threshold: 1024 }));

// Cookie parser for reading httpOnly refresh tokens
app.use(cookieParser());

// CORS configuration
const allowedOrigins = process.env.CLIENT_URL
  ? (process.env.CLIENT_URL.includes(',') ? process.env.CLIENT_URL.split(',').map(url => url.trim()) : process.env.CLIENT_URL.trim())
  : '*';

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  // File downloads (e.g. the admin customer export) need these readable by JS
  // when the client is served from a different origin than the API.
  exposedHeaders: ['Content-Disposition', 'X-Total-Records'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded product images statically.
// Filenames are content-unique (`wagh_<timestamp>_<rand>.jpg`), so they can be
// cached aggressively — this removes repeat image requests from the page load entirely.
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), {
  maxAge: '30d',
  immutable: true,
  etag: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300, // limit each IP
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Health check — registered before the DB gate so it still answers while the
// database is unreachable, and reports connection state for monitoring.
app.get('/api/v1/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    success: true,
    message: 'WAGH Mobile Accessories API is healthy & running',
    database: states[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date(),
  });
});

// Guarantee a live (pooled, reused) MongoDB connection before any handler runs
app.use('/api/', ensureDBConnection);

// API Routes (versioned /api/v1)
app.use('/api/v1/admin/google-drive', googleDriveRoutes);
app.use('/api/v1/admin/github', githubRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1', receiptRoutes);
app.use('/api/v1', couponRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1', extraRoutes);

// Razorpay Direct Alias Routes (Step 1 & Step 3 requirements)
const { createRazorpayOrder, verifyRazorpayPayment } = require('./controllers/orderController');
const { protect } = require('./middleware/auth');
app.post('/api/create-order', protect, createRazorpayOrder);
app.post('/api/verify-payment', protect, verifyRazorpayPayment);

// 404 Catch-All Handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found - ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5050;

// Kick off the connection immediately so the pool is warm before the first
// request arrives; `ensureDBConnection` awaits this same cached promise.
connectDB().catch((err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
  console.error('   Server is up but requests will return 503 until the database is reachable.');
});

// On Vercel the platform owns the listener, so only bind a port when running standalone.
let server;
if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`🚀 WAGH Server listening on port ${PORT}`);
  });
}

const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down server...`);
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      mongoose.connection.close(false)
        .then(() => {
          console.log('MongoDB connection closed.');
          process.exit(0);
        })
        .catch(() => process.exit(0));
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = app;
