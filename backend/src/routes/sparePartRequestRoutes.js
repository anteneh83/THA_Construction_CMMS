const express = require('express');
const router = express.Router();
const { createSparePartRequest, getSparePartRequests, getSparePartRequest, updateRequestStatus } = require('../controllers/sparePartRequestController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'Accountant', 'SiteManager'), getSparePartRequests)
  .post(authorize('Admin'), upload.single('photo'), createSparePartRequest);

router.route('/:id').get(authorize('Admin', 'Accountant', 'SiteManager'), getSparePartRequest);
router.put('/:id/status', authorize('Admin'), updateRequestStatus);

module.exports = router;
