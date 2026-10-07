const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/uploadMiddleware');
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * Helper middleware wrapper to catch Multer errors gracefully.
 */
function handleMulter(uploadMiddlewareFn) {
  return (req, res, next) => {
    uploadMiddlewareFn(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: 'File too large. Maximum allowed size is 5MB per image.',
            });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              success: false,
              error: 'Unexpected file field or too many files uploaded (max 5).',
            });
          }
          return res.status(400).json({
            success: false,
            error: `Upload error: ${err.message}`,
          });
        }
        // Custom file filter error
        return res.status(err.status || 400).json({
          success: false,
          error: err.message || 'File upload rejected',
        });
      }
      next();
    });
  };
}

// POST /api/upload/single -> verifyToken, handles single file upload
router.post(
  '/single',
  verifyToken,
  handleMulter(upload.single('image')),
  uploadController.uploadSingle
);

// POST /api/upload/multiple -> verifyToken, handles up to 5 files
router.post(
  '/multiple',
  verifyToken,
  handleMulter(upload.array('images', 5)),
  uploadController.uploadMultiple
);

module.exports = router;
