const mongoose = require('mongoose');

const issueCaseSchema = new mongoose.Schema({
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
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
  matchStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'ClarificationRequired', 'Rejected', 'Matched', 'Unconfirmed'],
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

issueCaseSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('IssueCase', issueCaseSchema);
