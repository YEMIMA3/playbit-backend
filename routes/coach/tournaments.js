const express = require('express');
const {
  getCoachTournaments,
  registerForTournament,
  shareTournamentWithGroups,
  getMyTournaments,
  createTournament
} = require('../../controllers/coach/tournaments');

const router = express.Router();

const { protectCoach } = require('../../middlewares/authentication/coach');

router.use(protectCoach);
router.get('/', getCoachTournaments);
router.post('/', createTournament);
router.get('/my-tournaments', getMyTournaments);
router.post('/:id/register', registerForTournament);
router.post('/:id/share', shareTournamentWithGroups);

module.exports = router;