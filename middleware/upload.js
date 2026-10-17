const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const MAX_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10) * 1024 * 1024;

// Storage engine for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'aora-house',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf'],
    public_id: (req, file) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();
      return `${base}-${Date.now()}`;
    }
  }
});

function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp|svg|pdf/;
  const extOk  = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype) || file.mimetype === 'image/svg+xml' || file.mimetype === 'application/pdf';
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only image and PDF files are allowed'));
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter,
});

module.exports = upload;
