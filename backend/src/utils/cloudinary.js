const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload a file (Multer memory buffer, file path, or object) to Cloudinary and return the secure URL.
 * @param {Object|string} fileInput - Multer file object or file path string
 * @param {string} folder - Target folder in Cloudinary
 * @returns {Promise<string|null>} - Cloudinary secure URL, or null if failed/not configured
 */
const uploadToCloudinary = async (fileInput, folder = 'cmms') => {
  if (!isCloudinaryConfigured()) {
    console.warn('Cloudinary is not configured.');
    return null;
  }

  try {
    // 1. Handle Multer memoryStorage buffer
    if (fileInput && fileInput.buffer) {
      return new Promise((resolve) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: folder, resource_type: 'auto' },
          (error, result) => {
            if (error) {
              console.error('Cloudinary stream upload error:', error.message);
              return resolve(null);
            }
            resolve(result.secure_url);
          }
        );
        stream.end(fileInput.buffer);
      });
    }

    // 2. Handle file path string or object with path property
    const filePath = typeof fileInput === 'string' ? fileInput : fileInput?.path;
    if (filePath) {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: 'auto',
      });
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (unlinkError) {
        // Safe to ignore on read-only filesystems
      }
      return result.secure_url;
    }

    return null;
  } catch (error) {
    console.error('Cloudinary upload failed:', error.message);
    return null;
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadToCloudinary,
};
