const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userType: {
    type: String,
    enum: ['coach', 'athlete'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  additionalInfo: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Prevent duplicate registrations
registrationSchema.index({ tournament: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);