const mongoose = require('mongoose');

const handoverValidationSchema = new mongoose.Schema({
  sparePartRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SparePartRequest',
    required: true
  },
  purchaseRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseRecord',
    required: true
  },
  receivedVerification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReceivedVerification',
    required: true
  },
  matchStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Discrepancy'],
    default: 'Pending'
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  validatedAt: {
    type: Date,
    default: null
  },
  adminNotes: {
    type: String,
    trim: true,
    default: ''
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

handoverValidationSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('HandoverValidation', handoverValidationSchema);
