const express = require('express');
const router = express.Router();
const { loginAthlete, signupAthlete } = require('../../controllers/authentication/athlete');

// @desc    Athlete authentication routes
// @route   /api/auth/athlete
// 🟢 PUBLIC ROUTES

// Athlete login
router.post('/login', loginAthlete);

// Athlete signup
router.post('/signup', signupAthlete);

module.exports = router;