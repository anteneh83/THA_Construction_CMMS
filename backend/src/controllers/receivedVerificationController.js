const ReceivedVerification = require('../models/ReceivedVerification');
const SparePartRequest = require('../models/SparePartRequest');
const HandoverValidation = require('../models/HandoverValidation');
const PurchaseRecord = require('../models/PurchaseRecord');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');

// @desc    Submit received verification (Site Manager)
// @route   POST /api/received-verifications
exports.createReceivedVerification = async (req, res) => {
  try {
    const { sparePartRequest, description, date, sparePartName, serialNumber, dateReceived } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Photo is required' });
    }

    const spr = await SparePartRequest.findById(sparePartRequest);
    if (!spr) return res.status(404).json({ success: false, message: 'Spare part request not found' });

    const verification = await ReceivedVerification.create({
      sparePartRequest,
      siteManager: req.user._id,
      sparePartName: sparePartName || spr.sparePartName,
      serialNumber: serialNumber || spr.serialNumber,
      photo: `/uploads/${req.file.filename}`,
      description: description || '',
      dateReceived: dateReceived || date || Date.now(),
      date: date || Date.now()
    });

    // Update request status
    spr.status = 'Delivered';
    await spr.save();

    // Auto-create handover validation if purchase record exists
    const purchaseRecord = await PurchaseRecord.findOne({ sparePartRequest });
    if (purchaseRecord) {
      await HandoverValidation.create({
        sparePartRequest,
        purchaseRecord: purchaseRecord._id,
        receivedVerification: verification._id,
        matchStatus: 'Pending'
      });
    }

    // Notify admins
    const admins = await User.find({ role: 'Admin' });
    for (const admin of admins) {
      await createNotification({
        recipientId: admin._id,
        type: 'SparePartReceived',
        title: 'Spare Part Received',
        message: `Site Manager "${req.user.fullName || req.user.username}" confirmed receipt of "${spr.sparePartName}"`,
        relatedEntity: { entityType: 'SparePartRequest', entityId: spr._id }
      });
    }

    const populated = await ReceivedVerification.findById(verification._id)
      .populate({ path: 'sparePartRequest', populate: { path: 'car', select: 'name plateNumber' } })
      .populate('siteManager', 'username fullName');

    res.status(201).json({ success: true, verification: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get received verifications
// @route   GET /api/received-verifications
exports.getReceivedVerifications = async (req, res) => {
  try {
    const { sparePartRequest, page = 1, limit = 20 } = req.query;
    const query = {};
    if (req.user.role === 'SiteManager') query.siteManager = req.user._id;
    if (sparePartRequest) query.sparePartRequest = sparePartRequest;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [verifications, total] = await Promise.all([
      ReceivedVerification.find(query)
        .populate({ path: 'sparePartRequest', populate: { path: 'car', select: 'name plateNumber' } })
        .populate('siteManager', 'username fullName')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      ReceivedVerification.countDocuments(query)
    ]);

    res.status(200).json({ success: true, verifications, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
