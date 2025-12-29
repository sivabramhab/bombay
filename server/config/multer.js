const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define upload directory - Windows path for local, Linux path for EC2
const UPLOAD_DIR = process.env.UPLOAD_DIR || (process.platform === 'win32' 
  ? 'C:\\Users\\user\\Desktop\\Bella\\images' 
  : '/home/ubuntu/bombay-marketplace/uploads/images');

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

// File filter - handle different field names
const fileFilter = (req, file, cb) => {
  // For GST document field, accept PDF and images
  if (file.fieldname === 'gstDocument') {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('GST document must be PDF or image file!'), false);
    }
  } else {
    // For product images/videos (fieldname 'files'), accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed for product images!'), false);
    }
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

