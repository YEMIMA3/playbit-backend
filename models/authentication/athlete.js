const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const athleteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  sport: {
    type: String,
    required: [true, 'Sport is required'],
    trim: true
  },
  experience: {
    type: String,
    required: [true, 'Experience level is required'],
    enum: ['0-1', '1-3', '3-5', '5-10', '10+']
  },
  achievements: {
    type: String,
    trim: true,
    default: '',
    maxlength: [1000, 'Achievements cannot exceed 1000 characters']
  },
  isCertified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
athleteSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
athleteSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON output
athleteSchema.methods.toJSON = function() {
  const athlete = this.toObject();
  delete athlete.password;
  return athlete;
};

module.exports = mongoose.model('athletecredentials', athleteSchema);