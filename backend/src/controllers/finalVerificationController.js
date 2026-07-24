const FinalVerification = require('../models/FinalVerification');
const IssueCase = require('../models/IssueCase');
const SparePartRequest = require('../models/SparePartRequest');
const CarHistory = require('../models/CarHistory');
const Car = require('../models/Car');
const User = require('../models/User');
const ReceivedVerification = require('../models/ReceivedVerification');
const PurchaseRecord = require('../models/PurchaseRecord');
const { createNotification } = require('../utils/notifications');

// @desc    Submit final verification (Driver or Site Manager)
// @route   POST /api/final-verifications
exports.createFinalVerification = async (req, res) => {
  try {
    const { issueCase, sparePartRequest, description, date } = req.body;

    if (!['Driver', 'SiteManager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only Drivers and Site Managers can submit final verifications' });
    }

    const photoUrl = (req.file && (req.file.cloudinaryUrl || (req.file.filename ? `/uploads/${req.file.filename}` : ''))) || req.body.photo;

    if (!photoUrl) {
      return res.status(400).json({ success: false, message: 'Photo is required' });
    }

    // Check for duplicate submission
    const existing = await FinalVerification.findOne({
      issueCase, submittedBy: req.user._id
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already submitted a final verification for this case' });
    }

    const verification = await FinalVerification.create({
      issueCase,
      sparePartRequest: sparePartRequest || null,
      submittedBy: req.user._id,
      submitterRole: req.user.role,
      photo: photoUrl,
      description: description || '',
      date: date || Date.now()
    });

    // Notify admins
    const admins = await User.find({ role: 'Admin' });
    for (const admin of admins) {
      await createNotification({
        recipientId: admin._id,
        type: 'FinalVerificationSubmitted',
        title: 'Final Verification Submitted',
        message: `${req.user.role} "${req.user.fullName || req.user.username}" submitted a final verification`,
        relatedEntity: { entityType: 'FinalVerification', entityId: verification._id }
      });
    }

    // Check if both driver AND site manager have submitted — if so, send notification to admin
    const allVerifications = await FinalVerification.find({ issueCase });
    const hasDriver = allVerifications.some(v => v.submitterRole === 'Driver');
    const hasSiteManager = allVerifications.some(v => v.submitterRole === 'SiteManager');

    if (hasDriver && hasSiteManager) {
      const admins = await User.find({ role: 'Admin' });
      for (const admin of admins) {
        await createNotification({
          recipientId: admin._id,
          type: 'RepairReadyForApproval',
          title: 'Repair Ready for Approval',
          message: `Both Driver and Site Manager have verified the repair on case. Admin final approval is required.`,
          relatedEntity: { entityType: 'IssueCase', entityId: issueCase }
        });
      }
    }

    const populated = await FinalVerification.findById(verification._id)
      .populate({ path: 'issueCase', populate: { path: 'car', select: 'name plateNumber' } })
      .populate('submittedBy', 'username fullName role');

    res.status(201).json({ success: true, verification: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Admin Final Approval for completed repair
// @route   PUT /api/final-verifications/issue-case/:caseId/approve
exports.approveFinalRepair = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { oldPartSerialNumber, newPartSerialNumber, installedBy, photosBeforeRepair, photosAfterRepair, maintenanceCost, description } = req.body;

    const ic = await IssueCase.findById(caseId);
    if (!ic) return res.status(404).json({ success: false, message: 'Issue case not found' });

    const allVerifications = await FinalVerification.find({ issueCase: caseId });
    const driverVer = allVerifications.find(v => v.submitterRole === 'Driver');
    const siteManagerVer = allVerifications.find(v => v.submitterRole === 'SiteManager');

    if (!driverVer || !siteManagerVer) {
      return res.status(400).json({ success: false, message: 'Both Driver and Site Manager must submit final verifications before approval' });
    }

    const spr = await SparePartRequest.findOne({ issueCase: caseId });
    if (spr) {
      spr.status = 'Closed';
      await spr.save();
    }

    // Get Accountant's purchase record for price and other details
    const pr = spr ? await PurchaseRecord.findOne({ sparePartRequest: spr._id }) : null;

    // Get Site Manager's received verification
    const rv = spr ? await ReceivedVerification.findOne({ sparePartRequest: spr._id }) : null;

    // Create Vehicle Maintenance History (CarHistory)
    const history = await CarHistory.create({
      car: ic.car,
      eventType: 'SparePartReplacement',
      
      // Issue reporting and validation
      driverReport: ic.driverReport,
      siteManagerReport: ic.siteManagerReport,
      adminValidationDecision: ic.matchStatus,
      adminValidationNotes: ic.adminNotes || '',

      // Spare part request
      requestedSparePart: spr ? spr.sparePartName : 'Unknown Part',
      quantity: spr ? spr.quantity : 1,
      serialNumber: spr ? spr.serialNumber : '',
      requestDate: spr ? spr.createdAt : null,

      // Purchasing details
      purchaseReport: pr ? pr._id : null,

      // Receipt details
      receiptVerification: rv ? rv._id : null,

      // Installation details
      oldPartName: spr ? spr.sparePartName : 'Unknown Part',
      oldPartSerialNumber: oldPartSerialNumber || (spr ? spr.serialNumber : ''),
      newPartName: spr ? spr.sparePartName : 'Unknown Part',
      newPartSerialNumber: newPartSerialNumber || (pr ? pr.serialNumber : ''),
      installationDate: new Date(),
      installedBy: installedBy || 'Technician',

      // Final Verifications
      driverVerification: driverVer._id,
      siteManagerVerification: siteManagerVer._id,
      adminApproval: true,

      // Attachments
      photosBeforeRepair: photosBeforeRepair || (ic.driverReport ? [ic.driverReport.photo] : []),
      photosAfterRepair: photosAfterRepair || allVerifications.map(v => v.photo),
      maintenanceCost: maintenanceCost || (pr ? pr.totalPrice : 0),
      description: description || `Spare part replacement approved. Both Driver and Site Manager verified.`,
      createdBy: req.user._id
    });

    // Set car back to Active
    await Car.findByIdAndUpdate(ic.car, { status: 'Active' });

    // Notify Driver and Site Manager
    const notifyUsers = [];
    if (ic.driverReport) {
      const dr = await require('../models/IssueReport').findById(ic.driverReport);
      if (dr) notifyUsers.push(dr.reportedBy);
    }
    if (ic.siteManagerReport) {
      const smr = await require('../models/IssueReport').findById(ic.siteManagerReport);
      if (smr) notifyUsers.push(smr.reportedBy);
    }

    for (const userId of notifyUsers) {
      await createNotification({
        recipientId: userId,
        type: 'RepairApproved',
        title: 'Repair Approved & Case Closed',
        message: `Admin has approved the final repair and closed the maintenance case.`,
        relatedEntity: { entityType: 'IssueCase', entityId: ic._id }
      });
    }

    res.status(200).json({ success: true, history, message: 'Maintenance case approved and closed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get final verifications
// @route   GET /api/final-verifications
exports.getFinalVerifications = async (req, res) => {
  try {
    const { issueCase, submitterRole, page = 1, limit = 20 } = req.query;
    const query = {};
    if (req.user.role !== 'Admin') query.submittedBy = req.user._id;
    if (issueCase) query.issueCase = issueCase;
    if (submitterRole) query.submitterRole = submitterRole;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [verifications, total] = await Promise.all([
      FinalVerification.find(query)
        .populate({ path: 'issueCase', populate: { path: 'car', select: 'name plateNumber' } })
        .populate('submittedBy', 'username fullName role')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      FinalVerification.countDocuments(query)
    ]);

    res.status(200).json({ success: true, verifications, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
