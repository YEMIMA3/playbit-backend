const express = require('express');
const {
  getTournaments,
  getTournament,
  createTournament,
  updateTournament,
  deleteTournament,
  getTournamentStats
} = require('../../controllers/admin/tournaments');
const { verifyAdmin,protect } = require('../../middlewares/authentication/admin');

const router = express.Router();

// Apply admin middleware to all routes
router.use(protect);
router.use(verifyAdmin); // or use: router.use(authorize('admin'));

// Admin tournament routes
router.get('/', getTournaments);
router.get('/stats/overview', getTournamentStats);
router.get('/:id', getTournament);
router.post('/', createTournament);
router.put('/:id', updateTournament);
router.delete('/:id', deleteTournament);

module.exports = router;