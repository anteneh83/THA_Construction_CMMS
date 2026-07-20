const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Machine name is required'],
    trim: true
  },
  plateNumber: {
    type: String,
    required: [true, 'Plate/asset number is required'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Machine type/category is required'],
    trim: true
  },
  brand: {
    type: String,
    trim: true,
    default: ''
  },
  model: {
    type: String,
    trim: true,
    default: ''
  },
  manufacturingYear: {
    type: Number,
    default: null
  },
  engineNumber: {
    type: String,
    trim: true,
    default: ''
  },
  chassisNumber: {
    type: String,
    trim: true,
    default: ''
  },
  currentMileage: {
    type: Number,
    default: 0
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedSite: {
    type: String,
    trim: true,
    default: ''
  },
  photo: {
    type: String,
    default: null
  },
  registrationDocuments: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Active', 'Under Maintenance', 'Waiting for Spare Part', 'Out of Service'],
    default: 'Active'
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

carSchema.pre(/^find/, function(next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Car', carSchema);
