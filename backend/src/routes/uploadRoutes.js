const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { protect } = require('../middleware/auth');

// @route   POST /api/upload
// @desc    Upload single image directly to Cloudinary in-memory (Serverless / Vercel compatible)
router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const url = await uploadToCloudinary(req.file);
    if (!url) {
      return res.status(500).json({ success: false, message: 'Cloudinary upload failed or missing environment variables' });
    }

    res.status(200).json({ success: true, url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
