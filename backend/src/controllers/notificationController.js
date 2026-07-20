const Notification = require('../models/Notification');

// @desc    Get notifications for current user
// @route   GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;
    const query = { recipient: req.user._id };
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false })
    ]);

    res.status(200).json({
      success: true, notifications, unreadCount,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get dashboard stats (Admin)
// @route   GET /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const Car = require('../models/Car');
    const IssueReport = require('../models/IssueReport');
    const IssueCase = require('../models/IssueCase');
    const SparePartRequest = require('../models/SparePartRequest');
    const HandoverValidation = require('../models/HandoverValidation');
    const User = require('../models/User');

    const [
      totalCars, activeCars, underRepairCars,
      totalDrivers, totalSiteManagers, totalAccountants,
      openIssueReports, pendingIssueCases, unmatchedIssueCases,
      pendingRequests, purchasedRequests, pendingHandovers,
      recentHistory
    ] = await Promise.all([
      Car.countDocuments(),
      Car.countDocuments({ status: 'Active' }),
      Car.countDocuments({ status: 'UnderRepair' }),
      User.countDocuments({ role: 'Driver' }),
      User.countDocuments({ role: 'SiteManager' }),
      User.countDocuments({ role: 'Accountant' }),
      IssueReport.countDocuments({ status: 'Reported' }),
      IssueCase.countDocuments({ matchStatus: 'Pending' }),
      IssueCase.countDocuments({ matchStatus: 'Unconfirmed' }),
      SparePartRequest.countDocuments({ status: 'Requested' }),
      SparePartRequest.countDocuments({ status: 'Purchased' }),
      HandoverValidation.countDocuments({ matchStatus: 'Pending' }),
      require('../models/CarHistory').find().populate('car', 'name plateNumber').sort({ createdAt: -1 }).limit(10)
    ]);

    res.status(200).json({
      success: true,
      stats: {
        fleet: { total: totalCars, active: activeCars, underRepair: underRepairCars, inactive: totalCars - activeCars - underRepairCars },
        users: { drivers: totalDrivers, siteManagers: totalSiteManagers, accountants: totalAccountants },
        issues: { openReports: openIssueReports, pendingCases: pendingIssueCases, unmatchedCases: unmatchedIssueCases },
        spareParts: { pendingRequests, awaitingHandover: purchasedRequests, pendingHandoverValidation: pendingHandovers },
        recentHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
