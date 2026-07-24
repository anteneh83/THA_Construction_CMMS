const { uploadToCloudinary } = require('../utils/cloudinary');

const cloudinaryUpload = async (req, res, next) => {
  try {
    // Handle single file upload
    if (req.file) {
      const cloudinaryUrl = await uploadToCloudinary(req.file);
      if (cloudinaryUrl) {
        req.file.cloudinaryUrl = cloudinaryUrl;
      }
    }

    // Handle multiple files/fields upload
    if (req.files) {
      for (const key of Object.keys(req.files)) {
        const filesArray = req.files[key];
        for (const file of filesArray) {
          const cloudinaryUrl = await uploadToCloudinary(file);
          if (cloudinaryUrl) {
            file.cloudinaryUrl = cloudinaryUrl;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in cloudinaryUpload middleware:', error.message);
  }
  
  next();
};

module.exports = cloudinaryUpload;
