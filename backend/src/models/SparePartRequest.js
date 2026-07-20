const mongoose = require('mongoose');

const sparePartRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    unique: true,
    required: true
  },
  issueCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IssueCase',
    required: true
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedSiteManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAccountant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
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
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  reason: {
    type: String,
    trim: true,
    default: ''
  },
  photo: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Purchased', 'Delivered', 'Installed', 'Closed'],
    default: 'Pending'
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

sparePartRequestSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('SparePartRequest', sparePartRequestSchema);
