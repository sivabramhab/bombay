const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define upload directory - Windows path
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'C:\\Users\\user\\Desktop\\Bella\\images';

// Create directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Keep original filename (same name as provided)
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Check if file exists, if yes, add timestamp
    const filePath = path.join(UPLOAD_DIR, originalName);
    if (fs.existsSync(filePath)) {
      const timestamp = Date.now();
      cb(null, `${sanitizedName}_${timestamp}${ext}`);
    } else {
      // Use original filename (same name in database and folder)
      cb(null, originalName);
    }
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  }
});

module.exports = upload;

