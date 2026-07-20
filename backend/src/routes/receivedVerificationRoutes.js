const express = require('express');
const router = express.Router();
const { createReceivedVerification, getReceivedVerifications } = require('../controllers/receivedVerificationController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'SiteManager'), getReceivedVerifications)
  .post(authorize('SiteManager'), upload.single('photo'), createReceivedVerification);

module.exports = router;
