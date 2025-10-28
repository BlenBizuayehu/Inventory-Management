const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'), false);
  }
};

// Multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Error handling middleware
const handleUploadErrors = (err, req, res, next) => {
  if (err) {
    let status = 400;
    let message = err.message;

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size must be less than 5MB';
    } else if (err.message.includes('Invalid file type')) {
      message = 'Only JPEG, PNG, and GIF images are allowed';
    } else {
      status = 500;
      message = 'File upload failed';
    }

    return res.status(status).json({
      success: false,
      error: message
    });
  }
  next();
};

module.exports = {
  upload,
  handleUploadErrors
};