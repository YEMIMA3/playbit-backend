const express = require('express');
const router = express.Router();
const {
  registerAthlete,
  loginAthlete,
  getAthlete,
  updateAthlete,
  deleteAthlete
} = require('../../controllers/authentication/athlete');
const { protect, requireAthlete } = require('../../middlewares/authentication/athlete');

// @desc    Athlete authentication routes
// @route   /api/athlete/auth

// 🟢 PUBLIC ROUTES

// Register athlete
router.post('/register', registerAthlete);

// Login athlete
router.post('/login', loginAthlete);

// 🟢 PROTECTED ROUTES (require authentication)

// Get athlete profile
router.get('/profile', protect, requireAthlete, getAthlete);

// Update athlete profile
router.put('/profile', protect, requireAthlete, updateAthlete);

// Delete athlete account
router.delete('/profile', protect, requireAthlete, deleteAthlete);

module.exports = router;