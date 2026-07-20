const mongoose = require('mongoose');

const receivedVerificationSchema = new mongoose.Schema({
  sparePartRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SparePartRequest',
    required: true
  },
  siteManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sparePartName: {
    type: String,
    required: [true, 'Spare part name is required'],
    trim: true
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    trim: true
  },
  photo: {
    type: String,
    required: [true, 'Verification photo is required']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  dateReceived: {
    type: Date,
    default: Date.now
  },
  date: {
    type: Date,
    default: Date.now
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

receivedVerificationSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('ReceivedVerification', receivedVerificationSchema);
