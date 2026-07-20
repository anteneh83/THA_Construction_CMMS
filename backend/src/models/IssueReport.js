const mongoose = require('mongoose');

const issueReportSchema = new mongoose.Schema({
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: [true, 'Vehicle reference is required']
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required']
  },
  reporterRole: {
    type: String,
    enum: ['Driver', 'SiteManager'],
    required: [true, 'Reporter role is required']
  },
  issueCategory: {
    type: String,
    enum: [
      'Engine', 'Transmission', 'Hydraulic System', 'Electrical System',
      'Brakes', 'Steering', 'Tires/Tracks', 'Body/Frame',
      'Cooling System', 'Fuel System', 'Exhaust System', 'Other'
    ],
    required: [true, 'Issue category is required']
  },
  photo: {
    type: String,
    required: [true, 'Photo is required for issue reports']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Reported', 'Matched', 'Unconfirmed', 'Rejected', 'InProgress', 'Resolved'],
    default: 'Reported'
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

issueReportSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('IssueReport', issueReportSchema);
