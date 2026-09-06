const express = require('express');
const router = express.Router();
const multer = require('multer');
const { listCloudImages, uploadCloudImage } = require('../controllers/githubController');
const { verifyAdminToken } = require('../middleware/adminAuth');

// Memory storage (not disk) — the file only needs to exist in a Buffer long
// enough to be base64-encoded and PUT to the GitHub Contents API.
const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpg|jpeg|png|webp|svg)$/i;
  if (allowed.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and SVG images are allowed.'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

router.use(verifyAdminToken);

router.get('/images/:productId', listCloudImages);
router.post('/upload/:productId', upload.single('image'), uploadCloudImage);

module.exports = router;
