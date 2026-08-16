const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wagh-ecommerce';

// Reuse a single connection across hot reloads and serverless invocations.
// Without this cache every cold start pays the full Atlas handshake (~300-800ms).
const globalForMongoose = global;
let cached = globalForMongoose.__waghMongoose;
if (!cached) {
  cached = globalForMongoose.__waghMongoose = { conn: null, promise: null };
}

// Silently drop query conditions on fields that aren't in the schema rather than
// letting them widen a query unexpectedly.
mongoose.set('strictQuery', true);

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        // Keep sockets warm so subsequent requests skip the TCP + TLS handshake.
        maxPoolSize: 20,
        minPoolSize: 2,
        maxIdleTimeMS: 60000,

        // Fail fast instead of hanging a request for 30s when Atlas is unreachable.
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,

        // Queue operations issued before the handshake completes rather than throwing.
        bufferCommands: true,

        // Building indexes on every boot is wasted work in production; `npm run sync-indexes` owns it.
        autoIndex: process.env.NODE_ENV !== 'production',

        // Wire compression shrinks large product payloads on the DB round trip.
        compressors: ['zlib'],
      })
      .then((m) => {
        console.log('✅ Connected to MongoDB successfully.');
        return m;
      })
      .catch((err) => {
        // Reset so the next request can retry instead of reusing a rejected promise.
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Express middleware: guarantees a live connection before any handler touches a model.
function ensureDBConnection(req, res, next) {
  if (mongoose.connection.readyState === 1) return next();

  connectDB()
    .then(() => next())
    .catch((err) => {
      console.error('❌ MongoDB Connection Error:', err.message);
      res.status(503).json({
        success: false,
        message: 'Database is temporarily unavailable. Please try again shortly.',
      });
    });
}

module.exports = { connectDB, ensureDBConnection, mongoose };
