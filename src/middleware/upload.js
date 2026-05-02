/**
 * EmPay — Cloudinary Upload Middleware
 * 
 * We use Cloudinary to store profile pictures.
 * This ensures files persist even when the app is deployed to 
 * ephemeral platforms like Render, Heroku, or Vercel.
 */

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'empay-avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
    public_id: (req, file) => {
      // Use employee ID in the filename for better organization
      const id = req.params.id || 'anonymous';
      return `avatar-${id}-${Date.now()}`;
    },
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;
