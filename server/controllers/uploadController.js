/**
 * Handle single image upload.
 */
function uploadSingle(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No image file uploaded. Please upload a valid image file.',
    });
  }

  const fileData = {
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
    size: req.file.size,
    mimetype: req.file.mimetype,
  };

  return res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: fileData,
  });
}

/**
 * Handle multiple images upload (up to 10 images).
 */
function uploadMultiple(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No image files uploaded. Please upload at least one image file.',
    });
  }

  const filesData = req.files.map((file) => ({
    filename: file.filename,
    url: `/uploads/${file.filename}`,
    size: file.size,
    mimetype: file.mimetype,
  }));

  return res.status(201).json({
    success: true,
    count: filesData.length,
    message: `${filesData.length} file(s) uploaded successfully`,
    data: filesData,
  });
}

module.exports = {
  uploadSingle,
  uploadMultiple,
};
