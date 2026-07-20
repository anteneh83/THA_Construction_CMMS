const express = require('express');
const router = express.Router();
const { createFinalVerification, getFinalVerifications, approveFinalRepair } = require('../controllers/finalVerificationController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/')
  .get(getFinalVerifications)
  .post(authorize('Driver', 'SiteManager'), upload.single('photo'), createFinalVerification);

router.put('/issue-case/:caseId/approve', authorize('Admin'), approveFinalRepair);

module.exports = router;
