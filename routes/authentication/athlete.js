const express = require('express');
const router = express.Router();
const {
  registerAthlete,
  loginAthlete,
  getAthleteProfile,
  updateAthleteProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  deleteAccount
} = require('../../controllers/authentication/athlete');
const { protect, requireAthlete, rateLimit } = require('../../middlewares/authentication/athlete');

// @desc    Athlete authentication routes
// @route   /api/auth/athlete

// 🟢 PUBLIC ROUTES
// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Athlete authentication routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Register new athlete (with rate limiting)
router.post('/register', rateLimit(15 * 60 * 1000, 5), registerAthlete);

// Login athlete (with rate limiting)
router.post('/login', rateLimit(15 * 60 * 1000, 10), loginAthlete);

// Forgot password (with rate limiting)
router.post('/forgot-password', rateLimit(15 * 60 * 1000, 3), forgotPassword);

// Reset password with token
router.post('/reset-password/:resetToken', resetPassword);

// Verify email
router.get('/verify-email/:verificationToken', verifyEmail);

// Resend verification email (with rate limiting)
router.post('/resend-verification', rateLimit(15 * 60 * 1000, 3), resendVerificationEmail);

// 🟢 PROTECTED ROUTES (require athlete authentication)
// Get athlete profile
router.get('/profile', protect, requireAthlete, getAthleteProfile);

// Update athlete profile
router.put('/profile', protect, requireAthlete, updateAthleteProfile);

// Change password
router.put('/change-password', protect, requireAthlete, changePassword);

// Delete athlete account
router.delete('/delete-account', protect, requireAthlete, deleteAccount);

module.exports = router;