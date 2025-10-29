const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const coachCredentialsSchema = new mongoose.Schema({
  // Authentication Info
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },

  // Personal Information (from signup form)
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },

  // Professional Information (from signup form)
  sport: {
    type: String,
    required: [true, 'Primary sport is required'],
    trim: true
  },
  experience: {
    type: String,
    required: [true, 'Experience is required']
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'active'
  },

  // Last login tracking
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Hash password before saving
coachCredentialsSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
coachCredentialsSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update last login method - FIXED VERSION
coachCredentialsSchema.methods.updateLastLogin = async function() {
  try {
    this.lastLogin = new Date();
    await this.save();
    return this;
  } catch (error) {
    throw new Error('Failed to update last login: ' + error.message);
  }
};

module.exports = mongoose.model('coachcredentials', coachCredentialsSchema);