const PurchaseRecord = require('../models/PurchaseRecord');
const SparePartRequest = require('../models/SparePartRequest');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');

// @desc    Create purchase record (Accountant)
// @route   POST /api/purchase-records
exports.createPurchaseRecord = async (req, res) => {
  try {
    const { 
      sparePartRequest, sparePartName, serialNumber, supplier, 
      quantity, unitPrice, totalPrice, description, invoiceNumber, purchaseDate,
      price, supplierName 
    } = req.body;

    const purchasePhoto = (req.files && req.files['purchasePhoto'] && (req.files['purchasePhoto'][0].cloudinaryUrl || (req.files['purchasePhoto'][0].filename ? `/uploads/${req.files['purchasePhoto'][0].filename}` : ''))) || req.body.purchasePhoto || null;
    const receiptPhoto = (req.files && req.files['receiptPhoto'] && (req.files['receiptPhoto'][0].cloudinaryUrl || (req.files['receiptPhoto'][0].filename ? `/uploads/${req.files['receiptPhoto'][0].filename}` : ''))) || req.body.receiptPhoto || null;
    const photo = (req.files && req.files['photo'] && (req.files['photo'][0].cloudinaryUrl || (req.files['photo'][0].filename ? `/uploads/${req.files['photo'][0].filename}` : ''))) || req.body.photo || null;

    const finalPurchasePhoto = purchasePhoto || photo;
    const finalReceiptPhoto = receiptPhoto || photo;

    if (!finalPurchasePhoto || !finalReceiptPhoto) {
      return res.status(400).json({ success: false, message: 'Both purchase photo and receipt photo are required' });
    }

    const spr = await SparePartRequest.findById(sparePartRequest);
    if (!spr) return res.status(404).json({ success: false, message: 'Spare part request not found' });

    const finalPrice = totalPrice || price || (unitPrice ? unitPrice * (quantity || 1) : 0);

    const record = await PurchaseRecord.create({
      sparePartRequest,
      accountant: req.user._id,
      sparePartName: sparePartName || spr.sparePartName,
      serialNumber: serialNumber || spr.serialNumber,
      supplier: supplier || supplierName || '',
      quantity: quantity || spr.quantity || 1,
      unitPrice: unitPrice || (finalPrice / (quantity || 1)) || 0,
      totalPrice: finalPrice,
      invoiceNumber: invoiceNumber || '',
      purchaseDate: purchaseDate || Date.now(),
      purchasePhoto: finalPurchasePhoto,
      receiptPhoto: finalReceiptPhoto,
      description,
      // Compatibility fields
      photo: finalPurchasePhoto,
      price: finalPrice,
      supplierName: supplier || supplierName || ''
    });

    // Update request status
    spr.status = 'Purchased';
    await spr.save();

    // Notify admins with detailed purchase information
    const admins = await User.find({ role: 'Admin' });
    if (admins && admins.length > 0) {
      const adminIds = admins.map(a => a._id);
      const purchaseDetailsMsg = `Accountant "${req.user.fullName || req.user.username}" recorded a purchase:\n- Part: ${record.sparePartName}\n- Serial: ${record.serialNumber || 'N/A'}\n- Qty: ${record.quantity}\n- Unit Price: ${record.unitPrice}\n- Total: ${record.totalPrice}\n- Supplier: ${record.supplier || 'N/A'}\n- Invoice: ${record.invoiceNumber || 'N/A'}`;
      // Use bulk notification helper to create notifications for all admins
      const { createBulkNotifications } = require('../utils/notifications');
      await createBulkNotifications(adminIds, {
        type: 'PurchaseRecorded',
        title: 'Purchase Recorded',
        message: purchaseDetailsMsg,
        relatedEntity: { entityType: 'PurchaseRecord', entityId: record._id }
      });
    }

    const populated = await PurchaseRecord.findById(record._id)
      .populate('sparePartRequest').populate('accountant', 'username fullName');

    res.status(201).json({ success: true, record: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get purchase records
// @route   GET /api/purchase-records
exports.getPurchaseRecords = async (req, res) => {
  try {
    const { sparePartRequest, page = 1, limit = 20 } = req.query;
    const query = {};
    if (req.user.role === 'Accountant') query.accountant = req.user._id;
    if (sparePartRequest) query.sparePartRequest = sparePartRequest;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      PurchaseRecord.find(query)
        .populate({ path: 'sparePartRequest', populate: { path: 'car', select: 'name plateNumber' } })
        .populate('accountant', 'username fullName')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      PurchaseRecord.countDocuments(query)
    ]);

    res.status(200).json({ success: true, records, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single purchase record
// @route   GET /api/purchase-records/:id
exports.getPurchaseRecord = async (req, res) => {
  try {
    const record = await PurchaseRecord.findById(req.params.id)
      .populate({ path: 'sparePartRequest', populate: [{ path: 'car', select: 'name plateNumber' }, { path: 'assignedSiteManager', select: 'username fullName' }] })
      .populate('accountant', 'username fullName');
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.status(200).json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
