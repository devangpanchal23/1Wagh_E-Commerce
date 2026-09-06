const fs = require('fs');
const path = require('path');
const githubService = require('../services/githubService');
const MediaAsset = require('../models/MediaAsset');
const { UPLOADS_DIR } = require('../services/uploadStorageService');


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

    const productId = (req.body && req.body.productId) || 'unassigned';

    // multer gave us a Buffer, not a disk path — this route is running on a
    // read-only deployment filesystem (Vercel), where there is nowhere
    // durable to write locally. GitHub-backed cloud storage is the only
    // place that can actually persist the file here, so upload it there
    // directly (synchronously — there's no local copy to fall back to) and
    // hand back its jsDelivr URL as the canonical image URL.
    if (req.file.buffer) {
      if (!githubService.isConfigured()) {
        return res.status(503).json({
          success: false,
          code: 'GITHUB_AUTH_ERROR',
          message: `Image uploads are not available: this server has no writable local storage and GitHub-backed cloud storage is not configured (missing ${githubService.missingConfiguration().join(', ')}).`,
        });
      }

      const uploaded = await githubService.uploadImage({
        productId,
        originalName: req.file.originalname,
        buffer: req.file.buffer,
      });

      try {
        await MediaAsset.create({
          filename: uploaded.name,
          localUrl: uploaded.url,
          githubUrl: uploaded.url,
          githubPath: uploaded.path,
          productId,
          syncStatus: 'synced',
        });
      } catch (persistError) {
        console.error('[media] Failed to persist MediaAsset record:', persistError.message);
      }

      return res.status(201).json({
        success: true,
        data: {
          url: uploaded.url,
          publicId: uploaded.sha || uploaded.path,
          filename: uploaded.name,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        message: 'Product image uploaded successfully',
      });
    }

    // Local/dev server with a real, persistent filesystem — write to disk as
    // before, sync to GitHub in the background, and keep the local URL as
    // the immediate (and permanent, if GitHub is unreachable) fallback.
    //
    // Store a relative path, not an absolute host:port URL — the admin panel
    // and storefront may run on a different host/port (or a different domain
    // entirely once deployed) than whatever this upload request happened to
    // see. The client resolves this path against its own configured API
    // origin at render time, so the same record works in every environment.
    const fileUrl = `/uploads/${req.file.filename}`;
    const publicId = `local_${Date.now()}_${req.file.filename}`;

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
    const files = fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : [];
    const filesOnDisk = new Set(files);

    // One query covers both cases below: files that are on disk (to prefer
    // their synced jsDelivr URL over the local one) and files that only
    // exist as a MediaAsset row pointing at GitHub — which, on a read-only
    // deployment filesystem, is every upload (see uploadProductImage). Without
    // the latter, those images would upload fine but then vanish from this
    // gallery the moment the modal closed, since they never touched disk.
    const assets = await MediaAsset.find({
      $or: [{ filename: { $in: files } }, { githubUrl: { $ne: null } }],
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
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
      });

    const cloudOnlyAssets = assets
      .filter((asset) => !filesOnDisk.has(asset.filename))
      .map((asset) => ({
        url: asset.githubUrl,
        publicId: `local_${asset.filename}`,
        filename: asset.filename,
        size: null,
        createdAt: asset.createdAt,
      }));

    const combined = [...mediaList, ...cloudOnlyAssets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: combined,
      message: 'Media gallery retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};
