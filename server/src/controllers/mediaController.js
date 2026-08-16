const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// @desc    Upload product image (Local / Media Storage)
// @route   POST /api/v1/admin/upload
exports.uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    const publicId = `local_${Date.now()}_${req.file.filename}`;

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
    const host = req.get('host');
    const protocol = req.protocol;

    const mediaList = files
      .filter((file) => /\.(jpg|jpeg|png|webp|svg)$/i.test(file))
      .map((file) => {
        const filePath = path.join(UPLOADS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          url: `${protocol}://${host}/uploads/${file}`,
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
