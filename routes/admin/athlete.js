const express = require('express');
const router = express.Router();
const {
  getAthletes,
  getAthleteStats,
  getAthleteById,
  updateAthleteStatus,
  verifyAthlete,
  deleteAthlete,
  getFilterOptions
} = require('../../controllers/admin/athlete');
const { protect, verifyAdmin } = require('../../middlewares/authentication/admin');

// Apply admin middleware to all routes
router.use(protect);
router.use(verifyAdmin);
router.get('/', getAthletes);

router.get('/stats',  getAthleteStats);
router.get('/filters/options',  getFilterOptions);
router.get('/:id',  getAthleteById);
router.put('/:id/status', updateAthleteStatus);
router.put('/:id/verify', verifyAthlete);
router.delete('/:id', deleteAthlete);

module.exports = router;