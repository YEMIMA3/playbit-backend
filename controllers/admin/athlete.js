const Athlete = require('../../models/authentication/athlete');
const AthleteProfile = require('../../models/athlete/athleteprofile');

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// @desc    Get all athletes with filtering
// @route   GET /api/admin/athletes
// @access  Private/Admin
const getAthletes = async (req, res) => {
  try {
    const { sport, level, status, search, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    let filter = {};
    
    if (sport && sport !== 'all') filter.sport = sport;
    if (level && level !== 'all') filter.level = level;
    if (status && status !== 'all') filter.status = status;
    
    // Search functionality
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { sport: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get athletes with pagination
    const athletes = await Athlete.find({ ...filter, ...searchFilter })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Athlete.countDocuments({ ...filter, ...searchFilter });

    // Get profiles for additional data
    const athleteIds = athletes.map(athlete => athlete._id);
    const profiles = await AthleteProfile.find({ athleteId: { $in: athleteIds } });

    // Combine athlete data with profile data
    const athletesWithProfiles = athletes.map(athlete => {
      const profile = profiles.find(p => p.athleteId.toString() === athlete._id.toString());
      const age = profile?.dateOfBirth ? calculateAge(profile.dateOfBirth) : null;
      
      return {
        _id: athlete._id,
        id: athlete._id,
        name: athlete.name,
        email: athlete.email,
        sport: athlete.sport,
        experience: athlete.experience,
        status: athlete.status,
        isVerified: athlete.isVerified,
        role: athlete.role,
        createdAt: athlete.createdAt,
        lastLogin: athlete.lastLogin,
        // Profile data
        phone: profile?.phone || '',
        location: profile?.location || '',
        level: profile?.level || 'Beginner',
        age: age,
        bio: profile?.bio || '',
        dateOfBirth: profile?.dateOfBirth || null,
        height: profile?.height || '',
        weight: profile?.weight || '',
        profileImage: profile?.profileImage || '',
        achievements: profile?.achievements || [],
        isProfileComplete: profile?.isProfileComplete || false
      };
    });

    res.status(200).json({
      success: true,
      data: athletesWithProfiles,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total: total
      }
    });

  } catch (error) {
    console.error('Get athletes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching athletes',
      error: error.message
    });
  }
};

// @desc    Get athlete statistics
// @route   GET /api/admin/athletes/stats
// @access  Private/Admin
const getAthleteStats = async (req, res) => {
  try {
    const totalAthletes = await Athlete.countDocuments();
    const activeAthletes = await Athlete.countDocuments({ status: 'active' });
    const verifiedAthletes = await Athlete.countDocuments({ isVerified: true });
    
    // Get level distribution from profiles
    const levelStats = await AthleteProfile.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get sport distribution
    const sportStats = await Athlete.aggregate([
      {
        $group: {
          _id: '$sport',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get registration trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const registrationStats = await Athlete.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalAthletes,
        active: activeAthletes,
        verified: verifiedAthletes,
        levels: levelStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        sports: sportStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        registrations: registrationStats
      }
    });

  } catch (error) {
    console.error('Get athlete stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching athlete statistics',
      error: error.message
    });
  }
};

// @desc    Get single athlete details
// @route   GET /api/admin/athletes/:id
// @access  Private/Admin
const getAthleteById = async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.params.id).select('-password');
    
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    const profile = await AthleteProfile.findOne({ athleteId: req.params.id });
    const age = profile?.dateOfBirth ? calculateAge(profile.dateOfBirth) : null;

    const athleteData = {
      ...athlete.toObject(),
      profile: profile || null,
      phone: profile?.phone || '',
      location: profile?.location || '',
      level: profile?.level || 'Beginner',
      age: age,
      bio: profile?.bio || '',
      dateOfBirth: profile?.dateOfBirth || null,
      height: profile?.height || '',
      weight: profile?.weight || '',
      profileImage: profile?.profileImage || '',
      achievements: profile?.achievements || [],
      isProfileComplete: profile?.isProfileComplete || false
    };

    res.status(200).json({
      success: true,
      data: athleteData
    });

  } catch (error) {
    console.error('Get athlete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching athlete',
      error: error.message
    });
  }
};

// @desc    Update athlete status
// @route   PUT /api/admin/athletes/:id/status
// @access  Private/Admin
const updateAthleteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required: active, inactive, or suspended'
      });
    }

    const athlete = await Athlete.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Athlete status updated to ${status}`,
      data: athlete
    });

  } catch (error) {
    console.error('Update athlete status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating athlete status',
      error: error.message
    });
  }
};

// @desc    Verify athlete
// @route   PUT /api/admin/athletes/:id/verify
// @access  Private/Admin
const verifyAthlete = async (req, res) => {
  try {
    const athlete = await Athlete.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true, runValidators: true }
    ).select('-password');

    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Athlete verified successfully',
      data: athlete
    });

  } catch (error) {
    console.error('Verify athlete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying athlete',
      error: error.message
    });
  }
};

// @desc    Delete athlete
// @route   DELETE /api/admin/athletes/:id
// @access  Private/Admin
const deleteAthlete = async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.params.id);
    
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: 'Athlete not found'
      });
    }

    // Delete athlete profile if exists
    await AthleteProfile.findOneAndDelete({ athleteId: req.params.id });
    
    // Delete athlete
    await Athlete.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Athlete deleted successfully'
    });

  } catch (error) {
    console.error('Delete athlete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting athlete',
      error: error.message
    });
  }
};

// @desc    Get available sports and levels for filters
// @route   GET /api/admin/athletes/filters/options
// @access  Private/Admin
const getFilterOptions = async (req, res) => {
  try {
    const sports = await Athlete.distinct('sport');
    const levels = await AthleteProfile.distinct('level');
    
    res.status(200).json({
      success: true,
      data: {
        sports: sports.filter(sport => sport).sort(),
        levels: levels.filter(level => level).sort()
      }
    });

  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching filter options',
      error: error.message
    });
  }
};

module.exports = {
  getAthletes,
  getAthleteStats,
  getAthleteById,
  updateAthleteStatus,
  verifyAthlete,
  deleteAthlete,
  getFilterOptions
};