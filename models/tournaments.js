const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tournament name is required'],
    trim: true,
    maxlength: [100, 'Tournament name cannot exceed 100 characters']
  },
  sport: {
    type: String,
    required: [true, 'Sport type is required'],
    enum: ['Basketball', 'Football', 'Tennis', 'Badminton', 'Swimming', 'Cricket', 'Volleyball']
  },
  date: {
    type: Date,
    required: [true, 'Tournament date is required']
  },
  participants: {
    type: Number,
    required: [true, 'Number of participants is required'],
    min: [1, 'Participants must be at least 1']
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  prize: {
    type: String,
    trim: true
  },
  organizer: {
    type: String,
    required: [true, 'Organizer is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  registrationDeadline: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Visibility and access control
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite-only'],
    default: 'public'
  },
  allowedUserTypes: [{
    type: String,
    enum: ['coach', 'athlete'],
    default: ['coach', 'athlete']
  }],
  
  // Registration tracking
  registeredCoaches: [{
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  registeredAthletes: [{
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  
  // Capacity limits
  maxCoaches: {
    type: Number,
    default: 10
  },
  maxAthletes: {
    type: Number,
    default: 100
  },
  currentCoachCount: {
    type: Number,
    default: 0
  },
  currentAthleteCount: {
    type: Number,
    default: 0
  },
  
  // Sharing and groups
  sharedWithGroups: [{
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
tournamentSchema.index({ name: 'text', sport: 'text', location: 'text' });
tournamentSchema.index({ status: 1, date: 1 });
tournamentSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Tournament', tournamentSchema);