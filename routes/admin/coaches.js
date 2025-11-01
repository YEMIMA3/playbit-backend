const express = require('express');
const {
  getCoaches,
  getCoach,
  verifyCoach,
  rejectCoach,
  getCoachStats,
  searchCoaches
} = require('../../controllers/admin/coach');
const { protect, verifyAdmin } = require('../../middlewares/authentication/admin');

const router = express.Router();

// Apply admin middleware to all routes
router.use(protect);
router.use(verifyAdmin);

// Admin coach routes
router.get('/', getCoaches);
router.get('/stats', getCoachStats);
router.get('/search', searchCoaches);
router.get('/:id', getCoach);
router.put('/:id/verify', verifyCoach);
router.put('/:id/reject', rejectCoach);

module.exports = router;