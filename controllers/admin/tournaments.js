const Tournament = require('../../models/tournaments');

// @desc    Get all tournaments
// @route   GET /api/admin/tournaments
// @access  Private/Admin
const getTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find();
    
    res.json({
      success: true,
      count: tournaments.length,
      data: tournaments
    });
  } catch (error) {
    console.error('Error in getTournaments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single tournament
// @route   GET /api/admin/tournaments/:id
// @access  Private/Admin
const getTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      data: tournament
    });
  } catch (error) {
    console.error('Error in getTournament:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new tournament
// @route   POST /api/admin/tournaments
// @access  Private/Admin
const createTournament = async (req, res) => {
  try {
    const tournamentData = {
      ...req.body,
      createdBy: req.user.id // Add the user ID from middleware
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

// @desc    Update tournament
// @route   PUT /api/admin/tournaments/:id
// @access  Private/Admin
const updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      message: 'Tournament updated successfully',
      data: tournament
    });
  } catch (error) {
    console.error('Error in updateTournament:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete tournament
// @route   DELETE /api/admin/tournaments/:id
// @access  Private/Admin
const deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndDelete(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      message: 'Tournament deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error in deleteTournament:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get tournament statistics
// @route   GET /api/admin/tournaments/stats/overview
// @access  Private/Admin
const getTournamentStats = async (req, res) => {
  try {
    const total = await Tournament.countDocuments();
    const active = await Tournament.countDocuments({ status: 'active' });
    const upcoming = await Tournament.countDocuments({ status: 'upcoming' });
    const completed = await Tournament.countDocuments({ status: 'completed' });

    res.json({
      success: true,
      data: {
        total,
        active,
        upcoming,
        completed
      }
    });
  } catch (error) {
    console.error('Error in getTournamentStats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getTournaments,
  getTournament,
  createTournament,
  updateTournament,
  deleteTournament,
  getTournamentStats
};