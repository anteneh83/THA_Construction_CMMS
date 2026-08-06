const IssueCase = require('../models/IssueCase');
const IssueReport = require('../models/IssueReport');
const { createNotification } = require('../utils/notifications');

// @desc    Create issue case (pair driver + site manager reports)
// @route   POST /api/issue-cases
exports.createIssueCase = async (req, res) => {
  try {
    const { car, driverReport, siteManagerReport } = req.body;

    const issueCase = await IssueCase.create({
      car,
      driverReport: driverReport || null,
      siteManagerReport: siteManagerReport || null,
      matchStatus: 'Pending'
    });

    const populated = await IssueCase.findById(issueCase._id)
      .populate('car', 'name plateNumber')
      .populate({ path: 'driverReport', populate: { path: 'reportedBy', select: 'username fullName' } })
      .populate({ path: 'siteManagerReport', populate: { path: 'reportedBy', select: 'username fullName' } });

    res.status(201).json({ success: true, issueCase: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get active repair cases relevant to this user
// @route   GET /api/issue-cases/active
exports.getActiveIssueCases = async (req, res) => {
  try {
    const query = { matchStatus: { $in: ['Matched', 'Approved'] } };
    if (req.user.role === 'Driver' && req.user.assignedCar) {
      query.car = req.user.assignedCar;
    }

    const cases = await IssueCase.find(query)
      .populate('car', 'name plateNumber type')
      .populate({ path: 'driverReport', populate: [{ path: 'reportedBy', select: 'username fullName' }, { path: 'car', select: 'name plateNumber' }] })
      .populate({ path: 'siteManagerReport', populate: [{ path: 'reportedBy', select: 'username fullName' }, { path: 'car', select: 'name plateNumber' }] })
      .populate('validatedBy', 'username fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, issueCases: cases });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all issue cases with cross-validation view
// @route   GET /api/issue-cases
exports.getIssueCases = async (req, res) => {
  try {
    const { matchStatus, car, page = 1, limit = 20 } = req.query;
    const query = {};
    if (matchStatus) query.matchStatus = matchStatus;
    if (car) query.car = car;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [cases, total] = await Promise.all([
      IssueCase.find(query)
        .populate('car', 'name plateNumber type')
        .populate({ path: 'driverReport', populate: [{ path: 'reportedBy', select: 'username fullName' }, { path: 'car', select: 'name plateNumber' }] })
        .populate({ path: 'siteManagerReport', populate: [{ path: 'reportedBy', select: 'username fullName' }, { path: 'car', select: 'name plateNumber' }] })
        .populate('validatedBy', 'username fullName')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      IssueCase.countDocuments(query)
    ]);

    res.status(200).json({ success: true, issueCases: cases, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single issue case
// @route   GET /api/issue-cases/:id
exports.getIssueCase = async (req, res) => {
  try {
    const issueCase = await IssueCase.findById(req.params.id)
      .populate('car', 'name plateNumber type photo')
      .populate({ path: 'driverReport', populate: { path: 'reportedBy', select: 'username fullName' } })
      .populate({ path: 'siteManagerReport', populate: { path: 'reportedBy', select: 'username fullName' } })
      .populate('validatedBy', 'username fullName');

    if (!issueCase) return res.status(404).json({ success: false, message: 'Issue case not found' });

    res.status(200).json({ success: true, issueCase });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Validate issue case (Match, Flag as Unconfirmed, Reject)
// @route   PUT /api/issue-cases/:id/validate
exports.validateIssueCase = async (req, res) => {
  try {
    let { matchStatus, adminNotes } = req.body;

    if (!['Matched', 'Unconfirmed', 'Rejected', 'Approved', 'ClarificationRequired'].includes(matchStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid match status' });
    }

    // Map backward compatibility values
    if (matchStatus === 'Matched') matchStatus = 'Approved';
    if (matchStatus === 'Unconfirmed') matchStatus = 'ClarificationRequired';

    const issueCase = await IssueCase.findById(req.params.id);
    if (!issueCase) return res.status(404).json({ success: false, message: 'Issue case not found' });

    if (issueCase.matchStatus !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending cases can be validated again' });
    }

    issueCase.matchStatus = matchStatus;
    issueCase.validatedBy = req.user._id;
    issueCase.validatedAt = new Date();
    if (adminNotes) issueCase.adminNotes = adminNotes;
    await issueCase.save();

    // Update linked issue reports status
    const reportStatus = matchStatus === 'Approved' ? 'Matched' : matchStatus === 'Rejected' ? 'Rejected' : 'Unconfirmed';
    if (issueCase.driverReport) await IssueReport.findByIdAndUpdate(issueCase.driverReport, { status: reportStatus });
    if (issueCase.siteManagerReport) await IssueReport.findByIdAndUpdate(issueCase.siteManagerReport, { status: reportStatus });

    // Notify reporters
    const notifyUsers = [];
    if (issueCase.driverReport) {
      const dr = await IssueReport.findById(issueCase.driverReport);
      if (dr) notifyUsers.push(dr.reportedBy);
    }
    if (issueCase.siteManagerReport) {
      const smr = await IssueReport.findById(issueCase.siteManagerReport);
      if (smr) notifyUsers.push(smr.reportedBy);
    }

    const typeMap = { 
      Approved: 'IssueCaseMatched', 
      ClarificationRequired: 'IssueCaseUnconfirmed', 
      Rejected: 'IssueCaseRejected' 
    };
    for (const userId of notifyUsers) {
      await createNotification({
        recipientId: userId,
        type: typeMap[matchStatus],
        title: `Issue Report ${matchStatus}`,
        message: `Your issue report has been marked as ${matchStatus} by the admin.`,
        relatedEntity: { entityType: 'IssueCase', entityId: issueCase._id }
      });
    }

    const populated = await IssueCase.findById(issueCase._id)
      .populate('car', 'name plateNumber')
      .populate({ path: 'driverReport', populate: { path: 'reportedBy', select: 'username fullName' } })
      .populate({ path: 'siteManagerReport', populate: { path: 'reportedBy', select: 'username fullName' } })
      .populate('validatedBy', 'username fullName');

    res.status(200).json({ success: true, issueCase: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
