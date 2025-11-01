const express = require('express');
const {
  getAthleteTournaments,
  registerForTournament
} = require('../../controllers/athlete/tournaments');


const { protect } = require('../../middlewares/authentication/athlete');

const router = express.Router();
router.use(protect);
router.get('/', getAthleteTournaments);
router.post('/:id/register', registerForTournament);

module.exports = router;