const CoachProfile = require("../../models/coach/coachProfile.js");
const CoachRequest = require("../../models/athlete/coachrequest.js");

// 🟢 Get all coaches (remove status filter since it doesn't exist)
const getAllCoaches = async (req, res) => {
  try {
    console.log("🔍 Fetching all coaches...");
    
    // FIX: Remove status filter since it doesn't exist in your schema
    const coaches = await CoachProfile.find({}).select(
      "name email phone location sports experience bio certifications hourlyRate availability achievements profileImage"
    );
    
    console.log("✅ Coaches found:", coaches.length);
    
    // Check request status for each coach
    const coachesWithStatus = await Promise.all(
      coaches.map(async (coach) => {
        const existingRequest = await CoachRequest.findOne({
          athleteId: req.user.id,
          coachId: coach._id, // This should be coach._id from CoachProfile
          status: { $in: ["pending", "accepted"] }
        });

        return {
          ...coach.toObject(),
          requestStatus: existingRequest ? existingRequest.status : "not_sent"
        };
      })
    );

    res.status(200).json(coachesWithStatus);
  } catch (error) {
    console.error("❌ Error fetching coaches:", error);
    res.status(500).json({ message: "Error fetching coaches", error: error.message });
  }
};

// 🟡 Send request to coach
const sendRequestToCoach = async (req, res) => {
  try {
    const athleteId = req.user.id;
    const { coachId, message } = req.body;

    // Check if coach exists (remove status check)
    const coach = await CoachProfile.findOne({ 
      _id: coachId // Changed from coachId to _id
    });
    
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    // Check duplicate request
    const existingRequest = await CoachRequest.findOne({ 
      athleteId, 
      coachId,
      status: { $in: ["pending", "accepted"] }
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        message: `Request already ${existingRequest.status}` 
      });
    }

    // Create new request
    const request = new CoachRequest({ 
      athleteId, 
      coachId, 
      message: message || "I would like to train with you!" 
    });
    
    await request.save();

    res.status(201).json({ 
      message: "Request sent successfully", 
      request 
    });
  } catch (error) {
    console.error("Error sending request:", error);
    res.status(500).json({ message: "Error sending request", error: error.message });
  }
};

// 🟢 Get athlete's sent requests
const getMyRequests = async (req, res) => {
  try {
    const athleteId = req.user.id;
    
    const requests = await CoachRequest.find({ athleteId })
      .populate("coachId", "name sports experience profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ message: "Error fetching requests", error: error.message });
  }
};

module.exports = {
  getAllCoaches,
  sendRequestToCoach,
  getMyRequests
};