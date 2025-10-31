const express = require('express');
const router = express.Router();
const {
  registerAthlete,
  loginAthlete,
  getAthleteProfile,
  updateAthleteProfile,
  deleteAccount,
  changePassword,
  forgotPassword,
  resetPassword
} = require('../../controllers/authentication/athlete');
const { protect, requireAthlete } = require('../../middlewares/authentication/athlete');

// Public routes
router.post('/register', registerAthlete);
router.post('/login', loginAthlete);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

// Protected routes  
router.get('/profile', protect, requireAthlete, getAthleteProfile);
router.put('/profile', protect, requireAthlete, updateAthleteProfile);
router.put('/change-password', protect, requireAthlete, changePassword);
router.delete('/profile', protect, requireAthlete, deleteAccount);

module.exports = router;