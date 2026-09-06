const fs = require('fs');
const path = require('path');
const githubService = require('../services/githubService');
const MediaAsset = require('../models/MediaAsset');

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Fires the GitHub sync in the background after a local upload has already
// been written to disk and responded to the client. Deliberately not
// awaited by the caller — GitHub being slow or unreachable must never delay
// or fail the local upload, so any error here is only logged, and the local
// copy stays canonical (syncStatus 'failed') until a future upload succeeds.
function syncToGithubInBackground({ filename, filePath, productId }) {
  Promise.resolve()
    .then(() => fs.promises.readFile(filePath))
    .then((buffer) => githubService.uploadImage({ productId, originalName: filename, buffer }))
    .then((uploaded) =>
      MediaAsset.updateOne(
        { filename },
        { githubUrl: uploaded.url, githubPath: uploaded.path, syncStatus: 'synced', syncError: null }
      )
    )
    .catch((error) => {
      console.error(`[github-sync] Background sync failed for ${filename}:`, error.message);
      return MediaAsset.updateOne(
        { filename },
        { syncStatus: 'failed', syncError: error.message }
      ).catch(() => {});
    });
}

// @desc    Upload product image (Local / Media Storage)
// @route   POST /api/v1/admin/upload
exports.uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    // Store a relative path, not an absolute host:port URL — the admin panel
    // and storefront may run on a different host/port (or a different domain
    // entirely once deployed) than whatever this upload request happened to
    // see. The client resolves this path against its own configured API
    // origin at render time, so the same record works in every environment.
    const fileUrl = `/uploads/${req.file.filename}`;
    const publicId = `local_${Date.now()}_${req.file.filename}`;
    const productId = (req.body && req.body.productId) || 'unassigned';

    try {
      await MediaAsset.create({ filename: req.file.filename, localUrl: fileUrl, productId });
    } catch (persistError) {
      // A gallery-tracking hiccup must not fail the upload the admin is
      // actually waiting on — the file is already safely on disk either way.
      console.error('[media] Failed to persist MediaAsset record:', persistError.message);
    }

    if (githubService.isConfigured()) {
      syncToGithubInBackground({ filename: req.file.filename, filePath: req.file.path, productId });
    }

    res.status(201).json({
      success: true,
      data: {
        url: fileUrl,
        publicId: publicId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      message: 'Product image uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all uploaded media images for Cloud/Local gallery grid
// @route   GET /api/v1/admin/media
exports.getMediaGallery = async (req, res, next) => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      return res.json({ success: true, data: [] });
    }

    const files = fs.readdirSync(UPLOADS_DIR);

    // Look up sync state for these files in one query so a synced image can
    // be served from its faster, edge-cached jsDelivr URL instead of local
    // disk, while files uploaded before this tracking existed (no matching
    // MediaAsset row) fall back to their local URL exactly as before.
    const assets = await MediaAsset.find({ filename: { $in: files } }).lean();
    const assetByFilename = new Map(assets.map((asset) => [asset.filename, asset]));

    const mediaList = files
      .filter((file) => /\.(jpg|jpeg|png|webp|svg)$/i.test(file))
      .map((file) => {
        const filePath = path.join(UPLOADS_DIR, file);
        const stats = fs.statSync(filePath);
        const asset = assetByFilename.get(file);
        return {
          url: (asset && asset.githubUrl) || `/uploads/${file}`,
          publicId: `local_${file}`,
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      data: mediaList,
      message: 'Media gallery retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};
