const express = require('express');
const{ 
  getAllCoaches, 
  sendRequestToCoach,
  getMyRequests 
} = require("../../controllers/athlete/findCoaches.js");
const { protect } = require('../../middlewares/authentication/athlete');

const router = express.Router();

router.get("/", protect, getAllCoaches);
router.post("/send-request", protect, sendRequestToCoach);
router.get("/my-requests", protect, getMyRequests); // Add this route


module.exports = router;