const express = require("express");
const router = express.Router();

const {
  getCoachProfile,
  updateCoachProfile,
} = require("../../controllers/coach/coachProfile.js");

const { protectCoach } = require("../../middlewares/authentication/coach.js");

// 🟢 Get coach profile (auto-creates with signup data)
router.get("/", protectCoach, getCoachProfile);

// 🔵 Update coach profile
router.put("/", protectCoach, updateCoachProfile);

module.exports = router;