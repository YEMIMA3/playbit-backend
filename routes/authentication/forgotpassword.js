const express = require('express');
const router = express.Router();
const {
  forgotPassword,
  resetPassword
} = require('../../controllers/authentication/forgotpassword');

// @desc    Forgot password routes
// @route   /api/athlete/auth/forgot-password

// Send password reset email
router.post('/forgot-password', forgotPassword);

// Reset password with token
router.post('/reset-password/:token', resetPassword);

module.exports = router;