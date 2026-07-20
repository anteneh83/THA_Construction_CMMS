const express = require('express');
const router = express.Router();
const { createPurchaseRecord, getPurchaseRecords, getPurchaseRecord } = require('../controllers/purchaseRecordController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'Accountant'), getPurchaseRecords)
  .post(
    authorize('Accountant'),
    upload.fields([
      { name: 'purchasePhoto', maxCount: 1 },
      { name: 'receiptPhoto', maxCount: 1 },
      { name: 'photo', maxCount: 1 }
    ]),
    createPurchaseRecord
  );

router.route('/:id').get(authorize('Admin', 'Accountant'), getPurchaseRecord);

module.exports = router;
