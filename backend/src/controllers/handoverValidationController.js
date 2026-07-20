const HandoverValidation = require('../models/HandoverValidation');
const SparePartRequest = require('../models/SparePartRequest');
const { createNotification } = require('../utils/notifications');

// @desc    Get handover validations
// @route   GET /api/handover-validations
exports.getHandoverValidations = async (req, res) => {
  try {
    const { matchStatus, page = 1, limit = 20 } = req.query;
    const query = {};
    if (matchStatus) query.matchStatus = matchStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [validations, total] = await Promise.all([
      HandoverValidation.find(query)
        .populate({ path: 'sparePartRequest', populate: [{ path: 'car', select: 'name plateNumber' }, { path: 'assignedSiteManager', select: 'username fullName' }, { path: 'assignedAccountant', select: 'username fullName' }] })
        .populate({ path: 'purchaseRecord', populate: { path: 'accountant', select: 'username fullName' } })
        .populate({ path: 'receivedVerification', populate: { path: 'siteManager', select: 'username fullName' } })
        .populate('validatedBy', 'username fullName')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      HandoverValidation.countDocuments(query)
    ]);

    res.status(200).json({ success: true, validations, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Validate handover (Confirm or Flag Discrepancy)
// @route   PUT /api/handover-validations/:id/validate
exports.validateHandover = async (req, res) => {
  try {
    const { matchStatus, adminNotes } = req.body;

    if (!['Confirmed', 'Discrepancy'].includes(matchStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be Confirmed or Discrepancy' });
    }

    const validation = await HandoverValidation.findById(req.params.id);
    if (!validation) return res.status(404).json({ success: false, message: 'Handover validation not found' });

    validation.matchStatus = matchStatus;
    validation.validatedBy = req.user._id;
    validation.validatedAt = new Date();
    if (adminNotes) validation.adminNotes = adminNotes;
    await validation.save();

    // Update spare part request status
    if (matchStatus === 'Confirmed') {
      await SparePartRequest.findByIdAndUpdate(validation.sparePartRequest, { status: 'HandoverConfirmed' });
    }

    // Notify relevant parties
    const spr = await SparePartRequest.findById(validation.sparePartRequest);
    if (spr) {
      const notifyType = matchStatus === 'Confirmed' ? 'HandoverConfirmed' : 'HandoverDiscrepancy';
      const recipients = [spr.assignedSiteManager];
      if (spr.assignedAccountant) recipients.push(spr.assignedAccountant);

      for (const recipientId of recipients) {
        await createNotification({
          recipientId,
          type: notifyType,
          title: matchStatus === 'Confirmed' ? 'Handover Confirmed' : 'Handover Discrepancy',
          message: matchStatus === 'Confirmed'
            ? `Handover for "${spr.sparePartName}" has been confirmed by admin`
            : `Discrepancy flagged for "${spr.sparePartName}" handover. Please contact admin.`,
          relatedEntity: { entityType: 'HandoverValidation', entityId: validation._id }
        });
      }
    }

    const populated = await HandoverValidation.findById(validation._id)
      .populate({ path: 'sparePartRequest', populate: { path: 'car', select: 'name plateNumber' } })
      .populate({ path: 'purchaseRecord', populate: { path: 'accountant', select: 'username fullName' } })
      .populate({ path: 'receivedVerification', populate: { path: 'siteManager', select: 'username fullName' } })
      .populate('validatedBy', 'username fullName');

    res.status(200).json({ success: true, validation: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
