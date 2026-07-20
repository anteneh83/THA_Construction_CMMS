const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, getDashboardStats } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

module.exports = router;
