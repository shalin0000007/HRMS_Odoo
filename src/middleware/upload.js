/**
 * EmPay — Multer Upload Middleware
 *
 * PROFILE PICTURE STORAGE STRATEGY (Engineer A's decision):
 * ─────────────────────────────────────────────────────────
 * Files are stored on the LOCAL filesystem under:
 *   backend/uploads/avatars/<uuid>.<ext>
 *
 * The RELATIVE path (e.g. "/uploads/avatars/abc123.jpg") is saved
 * in the `employee_profiles.avatarUrl` column in PostgreSQL.
 *
 * The Express app serves the /uploads folder as static files:
 *   GET http://localhost:5000/uploads/avatars/abc123.jpg
 *
 * WHY NOT DATABASE BLOBs?
 *   Storing raw binary in PostgreSQL bloats the DB, makes queries
 *   slower, and causes memory spikes during reads. Filesystem is
 *   the standard approach even at production scale (or CDN for prod).
 *
 * WHY NOT CLOUDINARY/S3?
 *   Zero external account setup needed for a 24-hour hackathon.
 *   Switch to S3/Cloudinary in production by just changing this file.
 *
 * Constraints:
 *   - Max file size: 2 MB
 *   - Allowed MIME types: image/jpeg, image/png, image/webp
 *   - Old file is deleted when a new avatar is uploaded
 */

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

module.exports = upload;
