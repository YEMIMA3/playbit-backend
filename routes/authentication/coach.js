const express = require("express");
const router = express.Router(); // Use Express Router, not the standalone 'router' package

const {
  registerCoach,
  loginCoach,
  getCoachProfile
} = require("../../controllers/authentication/coach");

const { protectCoach } = require("../../middlewares/authentication/coach");

// ✅ Public routes
router.post("/register", registerCoach);
router.post("/login", loginCoach);

// ✅ Protected route
router.get("/profile", protectCoach, getCoachProfile);

module.exports = router;