const IssueReport = require('../models/IssueReport');
const Car = require('../models/Car');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');

// @desc    Submit issue report (Driver or Site Manager)
// @route   POST /api/issue-reports
exports.createIssueReport = async (req, res) => {
  try {
    const { car, description, date, issueCategory } = req.body;
    const reporter = req.user;

    if (!['Driver', 'SiteManager'].includes(reporter.role)) {
      return res.status(403).json({ success: false, message: 'Only Drivers and Site Managers can submit issue reports' });
    }

    const photoUrl = (req.file && (req.file.cloudinaryUrl || (req.file.filename ? `/uploads/${req.file.filename}` : ''))) || req.body.photo;

    if (!photoUrl) {
      return res.status(400).json({ success: false, message: 'Photo is required' });
    }

    // For drivers, use their assigned car if not specified
    let carId = car;
    if (reporter.role === 'Driver' && !carId) {
      if (!reporter.assignedCar) {
        return res.status(400).json({ success: false, message: 'No car assigned to you' });
      }
      carId = reporter.assignedCar;
    }

    const carExists = await Car.findById(carId);
    if (!carExists) {
      return res.status(404).json({ success: false, message: 'Car not found' });
    }

    const report = await IssueReport.create({
      car: carId,
      reportedBy: reporter._id,
      reporterRole: reporter.role,
      issueCategory: issueCategory || 'General',
      photo: photoUrl,
      description: description || '',
      date: date || Date.now(),
      status: 'Reported'
    });

    // Notify all admins
    const admins = await User.find({ role: 'Admin' });
    for (const admin of admins) {
      await createNotification({
        recipientId: admin._id,
        type: 'IssueReported',
        title: 'New Issue Report',
        message: `${reporter.role} "${reporter.fullName || reporter.username}" reported an issue on car "${carExists.name}" (${carExists.plateNumber})`,
        relatedEntity: { entityType: 'IssueReport', entityId: report._id }
      });
    }

    const populated = await IssueReport.findById(report._id)
      .populate('car', 'name plateNumber type')
      .populate('reportedBy', 'username fullName role');

    res.status(201).json({ success: true, report: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get issue reports
// @route   GET /api/issue-reports
exports.getIssueReports = async (req, res) => {
  try {
    const { reporterRole, car, status, page = 1, limit = 20 } = req.query;
    const query = {};

    // RBAC: non-admins only see their own
    if (req.user.role !== 'Admin') {
      query.reportedBy = req.user._id;
    } else {
      if (reporterRole) query.reporterRole = reporterRole;
    }

    if (car) query.car = car;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reports, total] = await Promise.all([
      IssueReport.find(query)
        .populate('car', 'name plateNumber type')
        .populate('reportedBy', 'username fullName role')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      IssueReport.countDocuments(query)
    ]);

    res.status(200).json({ success: true, reports, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single issue report
// @route   GET /api/issue-reports/:id
exports.getIssueReport = async (req, res) => {
  try {
    const report = await IssueReport.findById(req.params.id)
      .populate('car', 'name plateNumber type photo')
      .populate('reportedBy', 'username fullName role');

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    // RBAC check
    if (req.user.role !== 'Admin' && report.reportedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
