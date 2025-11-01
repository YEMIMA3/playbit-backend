const CoachProfile = require('../../models/coach/coachProfile');
const CoachCredentials = require('../../models/authentication/coach');

// @desc    Get all coaches with filtering
// @route   GET /api/admin/coaches
// @access  Private/Admin
const getCoaches = async (req, res) => {
  try {
    const {
      search,
      sport,
      location,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    let filter = {};

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { sports: { $in: [new RegExp(search, 'i')] } },
        { certifications: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sport filter
    if (sport) {
      filter.sports = { $in: [new RegExp(sport, 'i')] };
    }

    // Location filter
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    // Get coaches with population
    const coaches = await CoachProfile.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('coachId', 'username email status createdAt');

    // Get total count for pagination
    const total = await CoachProfile.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Format response data
    const formattedCoaches = coaches.map(coach => ({
      _id: coach._id,
      coachId: coach.coachId?._id,
      name: coach.name,
      email: coach.email || coach.coachId?.email,
      phone: coach.phone,
      location: coach.location,
      sports: coach.sports,
      experience: coach.experience,
      bio: coach.bio,
      certifications: coach.certifications,
      hourlyRate: coach.hourlyRate,
      availability: coach.availability,
      achievements: coach.achievements,
      profileImage: coach.profileImage,
      status: coach.coachId?.status || 'active',
      joinDate: coach.coachId?.createdAt || coach.createdAt,
      rating: 4.5, // You can calculate this from reviews
      students: 0, // You can calculate this from registrations
      specialties: coach.certifications || []
    }));

    res.json({
      success: true,
      count: formattedCoaches.length,
      total,
      totalPages,
      currentPage: parseInt(page),
      data: formattedCoaches
    });
  } catch (error) {
    console.error('Error in getCoaches:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Get coach by ID
// @route   GET /api/admin/coaches/:id
// @access  Private/Admin
const getCoach = async (req, res) => {
  try {
    const coach = await CoachProfile.findById(req.params.id)
      .populate('coachId', 'username email status createdAt');

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Format response data
    const formattedCoach = {
      _id: coach._id,
      coachId: coach.coachId?._id,
      name: coach.name,
      email: coach.email || coach.coachId?.email,
      phone: coach.phone,
      location: coach.location,
      sports: coach.sports,
      experience: coach.experience,
      bio: coach.bio,
      certifications: coach.certifications,
      hourlyRate: coach.hourlyRate,
      availability: coach.availability,
      achievements: coach.achievements,
      profileImage: coach.profileImage,
      status: coach.coachId?.status || 'active',
      joinDate: coach.coachId?.createdAt || coach.createdAt,
      rating: 4.5,
      students: 0,
      specialties: coach.certifications || []
    };

    res.json({
      success: true,
      data: formattedCoach
    });
  } catch (error) {
    console.error('Error in getCoach:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify coach
// @route   PUT /api/admin/coaches/:id/verify
// @access  Private/Admin
const verifyCoach = async (req, res) => {
  try {
    const coachProfile = await CoachProfile.findById(req.params.id).populate('coachId');

    if (!coachProfile || !coachProfile.coachId) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Update coach status in credentials
    coachProfile.coachId.status = 'verified';
    await coachProfile.coachId.save();

    res.json({
      success: true,
      message: 'Coach verified successfully',
      data: {
        _id: coachProfile._id,
        name: coachProfile.name,
        status: 'verified'
      }
    });
  } catch (error) {
    console.error('Error in verifyCoach:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reject coach
// @route   PUT /api/admin/coaches/:id/reject
// @access  Private/Admin
const rejectCoach = async (req, res) => {
  try {
    const coachProfile = await CoachProfile.findById(req.params.id).populate('coachId');

    if (!coachProfile || !coachProfile.coachId) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Update coach status in credentials
    coachProfile.coachId.status = 'rejected';
    await coachProfile.coachId.save();

    res.json({
      success: true,
      message: 'Coach rejected successfully',
      data: {
        _id: coachProfile._id,
        name: coachProfile.name,
        status: 'rejected'
      }
    });
  } catch (error) {
    console.error('Error in rejectCoach:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get coach statistics
// @route   GET /api/admin/coaches/stats
// @access  Private/Admin
const getCoachStats = async (req, res) => {
  try {
    const totalCoaches = await CoachProfile.countDocuments();
    
    // Get status counts from coach credentials
    const CoachCredentials = require('../../models/coach/coachCredentials');
    const verifiedCoaches = await CoachCredentials.countDocuments({ status: 'verified' });
    const pendingCoaches = await CoachCredentials.countDocuments({ status: 'pending' });
    const rejectedCoaches = await CoachCredentials.countDocuments({ status: 'rejected' });

    // Get sports distribution
    const sportsStats = await CoachProfile.aggregate([
      { $unwind: '$sports' },
      { $group: { _id: '$sports', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        total: totalCoaches,
        verified: verifiedCoaches,
        pending: pendingCoaches,
        rejected: rejectedCoaches,
        sports: sportsStats
      }
    });
  } catch (error) {
    console.error('Error in getCoachStats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Search coaches with advanced filtering
// @route   GET /api/admin/coaches/search
// @access  Private/Admin
const searchCoaches = async (req, res) => {
  try {
    const { q, sport, location, experience, minRate, maxRate } = req.query;

    let filter = {};

    // Text search
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { sports: { $in: [new RegExp(q, 'i')] } },
        { certifications: { $in: [new RegExp(q, 'i')] } },
        { bio: { $regex: q, $options: 'i' } }
      ];
    }

    // Sport filter
    if (sport) {
      filter.sports = { $in: [new RegExp(sport, 'i')] };
    }

    // Location filter
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Experience filter
    if (experience) {
      filter.experience = { $regex: experience, $options: 'i' };
    }

    // Rate filter
    if (minRate || maxRate) {
      filter.hourlyRate = {};
      if (minRate) filter.hourlyRate.$gte = parseInt(minRate);
      if (maxRate) filter.hourlyRate.$lte = parseInt(maxRate);
    }

    const coaches = await CoachProfile.find(filter)
      .populate('coachId', 'username email status createdAt')
      .limit(50);

    const formattedCoaches = coaches.map(coach => ({
      _id: coach._id,
      coachId: coach.coachId?._id,
      name: coach.name,
      email: coach.email || coach.coachId?.email,
      phone: coach.phone,
      location: coach.location,
      sports: coach.sports,
      experience: coach.experience,
      bio: coach.bio,
      certifications: coach.certifications,
      hourlyRate: coach.hourlyRate,
      availability: coach.availability,
      achievements: coach.achievements,
      profileImage: coach.profileImage,
      status: coach.coachId?.status || 'active',
      joinDate: coach.coachId?.createdAt || coach.createdAt
    }));

    res.json({
      success: true,
      count: formattedCoaches.length,
      data: formattedCoaches
    });
  } catch (error) {
    console.error('Error in searchCoaches:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getCoaches,
  getCoach,
  verifyCoach,
  rejectCoach,
  getCoachStats,
  searchCoaches
};