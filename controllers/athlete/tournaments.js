const Tournament = require('../../models/tournaments');
const Registration = require('../../models/registration');
const asyncHandler = require('express-async-handler');

// @desc    Get tournaments available for athletes
// @route   GET /api/athlete/tournaments
// @access  Private/Athlete
const getAthleteTournaments = asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Tournaments Controller - Request User:', req.user);
    console.log('🔍 Tournaments Controller - Request Athlete:', req.athlete);
    
    // Check if user is authenticated - support both req.user and req.athlete
    let userId;
    
    if (req.user && req.user.id) {
      userId = req.user.id;
    } else if (req.athlete && req.athlete._id) {
      userId = req.athlete._id.toString();
    } else {
      console.log('❌ No user or athlete in request');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated. Please login again.'
      });
    }

    console.log('✅ Using user ID:', userId);

    const {
      search,
      status,
      sport,
      page = 1,
      limit = 10
    } = req.query;

    // Build query for athlete-visible tournaments
    let query = {
      isActive: true,
      $or: [
        { allowedUserTypes: 'athlete' },
        { allowedUserTypes: { $in: ['athlete'] } }
      ]
    };

    // Search filter
    if (search) {
      query.$and = [
        query,
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { sport: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Sport filter
    if (sport && sport !== 'all') {
      query.sport = sport;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const tournaments = await Tournament.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .select('-registeredCoaches -registeredAthletes -sharedWithGroups');

    const total = await Tournament.countDocuments(query);

    // Get registration status for each tournament
    const tournamentsWithRegistration = await Promise.all(
      tournaments.map(async (tournament) => {
        const registration = await Registration.findOne({
          tournament: tournament._id,
          user: userId, // Use the resolved userId
          userType: 'athlete'
        });

        return {
          ...tournament.toObject(),
          userRegistration: registration ? {
            status: registration.status,
            registrationDate: registration.registrationDate
          } : null
        };
      })
    );

    res.json({
      success: true,
      count: tournaments.length,
      pagination: {
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      },
      data: tournamentsWithRegistration
    });
  } catch (error) {
    console.error('❌ Error in getAthleteTournaments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// @desc    Register athlete for tournament
// @route   POST /api/athlete/tournaments/:id/register
// @access  Private/Athlete
const registerForTournament = asyncHandler(async (req, res) => {
  try {
    // Check if user is authenticated - support both req.user and req.athlete
    let userId;
    
    if (req.user && req.user.id) {
      userId = req.user.id;
    } else if (req.athlete && req.athlete._id) {
      userId = req.athlete._id.toString();
    } else {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated. Please login again.'
      });
    }

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if tournament is available for athletes
    const isAvailable = tournament.allowedUserTypes.includes('athlete');

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This tournament is not available for athlete registration'
      });
    }

    // Check registration deadline
    if (tournament.registrationDeadline && new Date() > tournament.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      tournament: tournament._id,
      user: userId, // Use the resolved userId
      userType: 'athlete'
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: `You are already registered for this tournament (Status: ${existingRegistration.status})`
      });
    }

    // Check if athlete slots are available
    if (tournament.currentAthleteCount >= tournament.maxAthletes) {
      return res.status(400).json({
        success: false,
        message: 'No more athlete slots available for this tournament'
      });
    }

    // Create registration
    const registration = await Registration.create({
      tournament: tournament._id,
      user: userId, // Use the resolved userId
      userType: 'athlete',
      additionalInfo: req.body.additionalInfo || {}
    });

    // Add to tournament's registered athletes
    await Tournament.findByIdAndUpdate(tournament._id, {
      $push: {
        registeredAthletes: {
          athlete: userId, // Use the resolved userId
          status: 'pending'
        }
      },
      $inc: { currentAthleteCount: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for tournament. Waiting for approval.',
      data: registration
    });
  } catch (error) {
    console.error('Error in registerForTournament:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

module.exports = {
  getAthleteTournaments,
  registerForTournament
};