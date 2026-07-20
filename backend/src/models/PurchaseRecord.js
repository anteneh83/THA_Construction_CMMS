const mongoose = require('mongoose');

const purchaseRecordSchema = new mongoose.Schema({
  sparePartRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SparePartRequest',
    required: true
  },
  accountant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sparePartName: {
    type: String,
    required: true,
    trim: true
  },
  serialNumber: {
    type: String,
    required: true,
    trim: true
  },
  supplier: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  invoiceNumber: {
    type: String,
    required: true,
    trim: true
  },
  purchasePhoto: {
    type: String,
    required: [true, 'Purchase photo is required']
  },
  receiptPhoto: {
    type: String,
    required: [true, 'Receipt photo is required']
  },
  description: {
    type: String,
    required: [true, 'Purchase description is required'],
    trim: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

purchaseRecordSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('PurchaseRecord', purchaseRecordSchema);
