const mongoose = require('mongoose');

// Tracks the GitHub sync state for each locally-uploaded image, so the media
// gallery (and eventually the storefront) can prefer the jsDelivr-backed URL
// once background sync succeeds, while always having the local copy as a
// safe fallback if GitHub was unreachable at upload time.
const mediaAssetSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  localUrl: { type: String, required: true },
  productId: { type: String, default: 'unassigned' },
  githubUrl: { type: String, default: null },
  githubPath: { type: String, default: null },
  syncStatus: { type: String, enum: ['pending', 'synced', 'failed'], default: 'pending' },
  syncError: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.models.MediaAsset || mongoose.model('MediaAsset', mediaAssetSchema);
