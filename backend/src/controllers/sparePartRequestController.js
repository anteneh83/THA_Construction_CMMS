const SparePartRequest = require('../models/SparePartRequest');
const IssueCase = require('../models/IssueCase');
const { createNotification } = require('../utils/notifications');

// @desc    Create spare part request (Admin only, after matched issue case)
// @route   POST /api/spare-part-requests
exports.createSparePartRequest = async (req, res) => {
  try {
    const { 
      issueCase, car, assignedSiteManager, assignedAccountant, 
      sparePartName, serialNumber, quantity, priority, reason 
    } = req.body;

    // Verify issue case is Matched or Approved
    const ic = await IssueCase.findById(issueCase);
    if (!ic || !['Matched', 'Approved'].includes(ic.matchStatus)) {
      return res.status(400).json({ success: false, message: 'Can only create requests for Matched/Approved issue cases' });
    }

    // Generate unique requestNumber
    const requestNumber = `REQ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const requestData = {
      requestNumber,
      issueCase, car: car || ic.car,
      requestedBy: req.user._id,
      assignedSiteManager,
      assignedAccountant: assignedAccountant || null,
      sparePartName, serialNumber,
      quantity: quantity || 1,
      priority: priority || 'Medium',
      reason: reason || '',
      status: 'Pending'
    };
    if (req.file) requestData.photo = `/uploads/${req.file.filename}`;

    const request = await SparePartRequest.create(requestData);

    // Notify accountant and site manager
    if (assignedAccountant) {
      await createNotification({
        recipientId: assignedAccountant,
        type: 'SparePartRequested',
        title: 'New Spare Part Request',
        message: `Admin has created a spare part request for "${sparePartName}" (S/N: ${serialNumber})`,
        relatedEntity: { entityType: 'SparePartRequest', entityId: request._id }
      });
    }
    await createNotification({
      recipientId: assignedSiteManager,
      type: 'SparePartRequested',
      title: 'Spare Part Assigned',
      message: `You have been assigned to receive spare part "${sparePartName}"`,
      relatedEntity: { entityType: 'SparePartRequest', entityId: request._id }
    });

    const populated = await SparePartRequest.findById(request._id)
      .populate('issueCase').populate('car', 'name plateNumber')
      .populate('requestedBy', 'username fullName')
      .populate('assignedSiteManager', 'username fullName')
      .populate('assignedAccountant', 'username fullName');

    res.status(201).json({ success: true, request: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get spare part requests
// @route   GET /api/spare-part-requests
exports.getSparePartRequests = async (req, res) => {
  try {
    const { status, car, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'Accountant') {
      query.assignedAccountant = req.user._id;
    } else if (req.user.role === 'SiteManager') {
      query.assignedSiteManager = req.user._id;
    }

    if (status) query.status = status;
    if (car) query.car = car;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [requests, total] = await Promise.all([
      SparePartRequest.find(query)
        .populate('issueCase').populate('car', 'name plateNumber type')
        .populate('requestedBy', 'username fullName')
        .populate('assignedSiteManager', 'username fullName')
        .populate('assignedAccountant', 'username fullName')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      SparePartRequest.countDocuments(query)
    ]);

    res.status(200).json({ success: true, requests, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single spare part request
// @route   GET /api/spare-part-requests/:id
exports.getSparePartRequest = async (req, res) => {
  try {
    const request = await SparePartRequest.findById(req.params.id)
      .populate('issueCase').populate('car', 'name plateNumber type photo')
      .populate('requestedBy', 'username fullName')
      .populate('assignedSiteManager', 'username fullName')
      .populate('assignedAccountant', 'username fullName');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.status(200).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update spare part request status
// @route   PUT /api/spare-part-requests/:id/status
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await SparePartRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = status;
    await request.save();

    const populated = await SparePartRequest.findById(request._id)
      .populate('car', 'name plateNumber')
      .populate('assignedSiteManager', 'username fullName')
      .populate('assignedAccountant', 'username fullName');

    res.status(200).json({ success: true, request: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
