const express = require('express');
const router = express.Router();
const {
  getAthleteProfile,
  updateAthleteProfile,
  uploadAchievement,
  deleteAchievement,
  uploadProfileImage
} = require('../../controllers/athlete/athleteprofile');
const { protect, requireAthlete } = require('../../middlewares/authentication/athlete');

// @desc    Athlete profile routes
// @route   /api/athlete/profile

// 🟢 PROTECTED ROUTES (require athlete authentication)

// Get athlete profile
router.get('/', protect, requireAthlete, getAthleteProfile);

// Update athlete profile
router.put('/', protect, requireAthlete, updateAthleteProfile);

// Upload profile image
router.post('/upload-image', protect, requireAthlete, uploadProfileImage);

// Upload achievement/certificate
router.post('/achievements', protect, requireAthlete, uploadAchievement);

// Delete achievement
router.delete('/achievements/:achievementId', protect, requireAthlete, deleteAchievement);

module.exports = router;