const githubService = require('../services/githubService');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = /\.(jpg|jpeg|png|webp|svg)$/i;

// @desc    List images already stored in this product's GitHub folder
// @route   GET /api/v1/admin/github/images/:productId
exports.listCloudImages = async (req, res, next) => {
  try {
    if (!githubService.isConfigured()) {
      return res.json({ error: false, images: [], message: 'GitHub cloud storage is not configured.' });
    }

    const images = await githubService.listFolderImages(req.params.productId);
    return res.json({ error: false, images, message: 'Cloud images retrieved successfully' });
  } catch (error) {
    return res.status(502).json({ error: true, message: error.message || 'Failed to load cloud images', images: [] });
  }
};

// @desc    Upload a new image straight into the product's GitHub folder
// @route   POST /api/v1/admin/github/upload/:productId
exports.uploadCloudImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'Please select an image file to upload.' });
    }

    if (!ALLOWED_TYPES.test(req.file.originalname)) {
      return res.status(400).json({ error: true, message: 'Invalid file type. Only JPG, PNG, WEBP, and SVG images are allowed.' });
    }

    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ error: true, message: 'File too large. Maximum size is 5MB.' });
    }

    if (!githubService.isConfigured()) {
      return res.status(503).json({ error: true, message: 'GitHub cloud storage is not configured on this server.' });
    }

    const uploaded = await githubService.uploadImage({
      productId: req.params.productId,
      originalName: req.file.originalname,
      buffer: req.file.buffer,
    });

    return res.status(201).json({
      error: false,
      images: [uploaded],
      message: 'Image uploaded to cloud storage successfully',
    });
  } catch (error) {
    return res.status(502).json({ error: true, message: error.message || 'Cloud upload failed' });
  }
};
