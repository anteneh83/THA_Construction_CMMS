const mongoose = require('mongoose');

const carHistorySchema = new mongoose.Schema({
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  eventType: {
    type: String,
    enum: ['SparePartReplacement', 'StatusChange', 'DriverAssignment'],
    default: 'SparePartReplacement'
  },
  
  // Issue reporting and validation
  driverReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IssueReport',
    default: null
  },
  siteManagerReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IssueReport',
    default: null
  },
  adminValidationDecision: {
    type: String,
    default: 'Approved'
  },
  adminValidationNotes: {
    type: String,
    default: ''
  },

  // Spare part request
  requestedSparePart: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    default: 1
  },
  serialNumber: {
    type: String,
    default: ''
  },
  requestDate: {
    type: Date,
    default: null
  },

  // Purchasing details
  purchaseReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseRecord',
    default: null
  },

  // Receipt details
  receiptVerification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReceivedVerification',
    default: null
  },

  // Installation details
  oldPartName: {
    type: String,
    trim: true,
    default: ''
  },
  oldPartSerialNumber: {
    type: String,
    trim: true,
    default: ''
  },
  newPartName: {
    type: String,
    trim: true,
    default: ''
  },
  newPartSerialNumber: {
    type: String,
    trim: true,
    default: ''
  },
  installationDate: {
    type: Date,
    default: Date.now
  },
  installedBy: {
    type: String,
    trim: true,
    default: ''
  },

  // Final Verifications
  driverVerification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinalVerification',
    default: null
  },
  siteManagerVerification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinalVerification',
    default: null
  },
  adminApproval: {
    type: Boolean,
    default: true
  },

  // Attachments
  photosBeforeRepair: [{
    type: String
  }],
  photosAfterRepair: [{
    type: String
  }],
  maintenanceCost: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CarHistory', carHistorySchema);
