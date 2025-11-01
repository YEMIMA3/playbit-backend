const Tournament = require('../../models/tournaments');
const Registration = require('../../models/registration');
const Group = require('../../models/group');
const asyncHandler = require('express-async-handler');

// @desc    Get tournaments available for athletes
// @route   GET /api/athlete/tournaments
// @access  Private/Athlete
const getAthleteTournaments = asyncHandler(async (req, res) => {
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
      { allowedUserTypes: { $in: ['athlete'] } },
      { 
        // Also include tournaments shared with athlete's groups
        'sharedWithGroups.group': { 
          $in: await getAthleteGroupIds(req.user.id) 
        }
      }
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
        user: req.user.id,
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
});

// Helper function to get athlete's group IDs
const getAthleteGroupIds = async (athleteId) => {
  const groups = await Group.find({
    'members.user': athleteId,
    isActive: true
  });
  return groups.map(group => group._id);
};

// @desc    Register athlete for tournament
// @route   POST /api/athlete/tournaments/:id/register
// @access  Private/Athlete
const registerForTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);

  if (!tournament) {
    return res.status(404).json({
      success: false,
      message: 'Tournament not found'
    });
  }

  // Check if tournament is available for athletes
  const isAvailable = tournament.allowedUserTypes.includes('athlete') || 
                     tournament.sharedWithGroups.some(share => 
                       getAthleteGroupIds(req.user.id).includes(share.group.toString())
                     );

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
    user: req.user.id,
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
    user: req.user.id,
    userType: 'athlete',
    additionalInfo: req.body.additionalInfo || {}
  });

  // Add to tournament's registered athletes
  await Tournament.findByIdAndUpdate(tournament._id, {
    $push: {
      registeredAthletes: {
        athlete: req.user.id,
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
});

module.exports = {
  getAthleteTournaments,
  registerForTournament
};