const mongoose = require('mongoose');

const finalVerificationSchema = new mongoose.Schema({
  issueCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IssueCase',
    required: true
  },
  sparePartRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SparePartRequest',
    default: null
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submitterRole: {
    type: String,
    enum: ['Driver', 'SiteManager'],
    required: true
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

finalVerificationSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('FinalVerification', finalVerificationSchema);
