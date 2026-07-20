const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/stats', authorize('Admin'), getDashboardStats);

module.exports = router;
