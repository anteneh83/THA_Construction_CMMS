const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'IssueReported',
      'IssueCaseMatched',
      'IssueCaseUnconfirmed',
      'IssueCaseRejected',
      'SparePartRequested',
      'PurchaseRecorded',
      'SparePartReceived',
      'HandoverConfirmed',
      'HandoverDiscrepancy',
      'FinalVerificationSubmitted',
      'CaseClosed',
      'General'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['IssueReport', 'IssueCase', 'SparePartRequest', 'PurchaseRecord', 'HandoverValidation', 'FinalVerification', 'Car'],
      default: null
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
