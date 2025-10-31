const mongoose = require('mongoose');

const coachProfileSchema = new mongoose.Schema({
  coachId: {  // Change from 'coach' to 'coachId'
    type: mongoose.Schema.Types.ObjectId,
    ref: 'coachcredentials',
    required: true,
    unique: true
  },
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  sports: [{
    type: String,
    trim: true
  }],
  experience: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  certifications: [{
    type: String,
    trim: true
  }],
  hourlyRate: {
    type: String,
    trim: true
  },
  availability: {
    type: String,
    trim: true
  },
  achievements: [{
    type: String,
    trim: true
  }],
  profileImage: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('coachprofile', coachProfileSchema);