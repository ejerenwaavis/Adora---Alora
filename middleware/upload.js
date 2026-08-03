const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const UPLOAD_DIR    = process.env.UPLOAD_DIR || 'public/uploads';
const MAX_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10) * 1024 * 1024;

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organise by type: images go to /public/uploads/images
    const sub = file.mimetype.startsWith('image/') ? 'images' : 'files';
    const dest = path.join(UPLOAD_DIR, sub);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const unique = `${base}-${Date.now()}${ext}`;
    cb(null, unique);
  },
});

function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp|svg|pdf/;
  const extOk  = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype) || file.mimetype === 'image/svg+xml';
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only image and PDF files are allowed'));
}

const upload = multer({
  storage,
  limits:     { fileSize: MAX_SIZE_BYTES },
  fileFilter,
});

module.exports = upload;
