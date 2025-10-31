const express = require("express");
const router = express.Router();

const {
  getCoachProfile,
  updateCoachProfile,
} = require("../../controllers/coach/coachProfile");

const { protectCoach } = require("../../middlewares/authentication/coach");

// Debug middleware
router.use((req, res, next) => {
  console.log('🔐 Coach Profile Route - Headers:', req.headers);
  console.log('🔐 Coach Profile Route - Coach ID:', req.coach?.id);
  next();
});

// 🟢 Get coach profile (auto-creates)
router.get("/", protectCoach, getCoachProfile);

// 🔵 Update coach profile
router.put("/", protectCoach, updateCoachProfile);

module.exports = router;