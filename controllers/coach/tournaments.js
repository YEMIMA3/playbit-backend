const Tournament = require('../../models/tournaments');
const Registration = require('../../models/registration');

// @desc    Get tournaments available for coaches
// @route   GET /api/coach/tournaments
// @access  Private/Coach
const getCoachTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({
      isActive: true,
      $or: [
        { allowedUserTypes: 'coach' },
        { allowedUserTypes: { $in: ['coach'] } }
      ]
    });

    const tournamentsWithRegistration = await Promise.all(
      tournaments.map(async (tournament) => {
        const registration = await Registration.findOne({
          tournament: tournament._id,
          user: req.user.id,
          userType: 'coach'
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
      data: tournamentsWithRegistration
    });
  } catch (error) {
    console.error('Error in getCoachTournaments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Register coach for tournament
// @route   POST /api/coach/tournaments/:id/register
// @access  Private/Coach
const registerForTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if tournament is available for coaches
    if (!tournament.allowedUserTypes.includes('coach')) {
      return res.status(400).json({
        success: false,
        message: 'This tournament is not available for coach registration'
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      tournament: tournament._id,
      user: req.user.id,
      userType: 'coach'
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this tournament'
      });
    }

    // Create registration
    const registration = await Registration.create({
      tournament: tournament._id,
      user: req.user.id,
      userType: 'coach'
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for tournament',
      data: registration
    });
  } catch (error) {
    console.error('Error in registerForTournament:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create tournament as coach
// @route   POST /api/coach/tournaments
// @access  Private/Coach
const createTournament = async (req, res) => {
  try {
    const tournamentData = {
      ...req.body,
      createdBy: req.user.id,
      allowedUserTypes: ['athlete'] // Coaches create tournaments for athletes
    };
    
    const tournament = await Tournament.create(tournamentData);

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: tournament
    });
  } catch (error) {
    console.error('Error in createTournament:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Simple versions for now (remove complex functions)
const shareTournamentWithGroups = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Tournament sharing feature coming soon'
    });
  } catch (error) {
    console.error('Error in shareTournamentWithGroups:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const getMyTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({ createdBy: req.user.id });
    
    res.json({
      success: true,
      count: tournaments.length,
      data: tournaments
    });
  } catch (error) {
    console.error('Error in getMyTournaments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getCoachTournaments,
  registerForTournament,
  shareTournamentWithGroups,
  getMyTournaments,
  createTournament
};