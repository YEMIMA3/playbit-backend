const express = require("express");
const { 
  getCoachRequests, 
  updateRequestStatus,
  getAcceptedAthletes 
} = require("../../controllers/coach/requestcontroller.js"); // Fix path to "controllers"
const { protectCoach } = require("../../middlewares/authentication/coach.js");

const router = express.Router();

router.get("/", protectCoach, getCoachRequests);
router.put("/:requestId", protectCoach, updateRequestStatus);
router.get("/accepted-athletes", protectCoach, getAcceptedAthletes);

module.exports = router;