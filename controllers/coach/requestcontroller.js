const CoachRequest = require("../../models/athlete/coachrequest.js");
const CoachProfile = require("../../models/coach/coachProfile.js"); // Add this import

// 🟢 Get all requests for a coach - FIXED
const getCoachRequests = async (req, res) => {
  try {
    const coachUserId = req.user.id; // This is from coachcredentials
    
    console.log("🔍 Coach User ID from auth:", coachUserId);
    
    // First, find the coach's profile using their user ID
    const coachProfile = await CoachProfile.findOne({ coachId: coachUserId });
    
    if (!coachProfile) {
      console.log("❌ No coach profile found for user:", coachUserId);
      return res.status(404).json({ 
        success: false,
        message: "Coach profile not found. Please complete your coach profile." 
      });
    }
    
    console.log("✅ Coach profile found:", {
      profileId: coachProfile._id,
      name: coachProfile.name
    });
    
    // Now find requests using the coach's PROFILE ID
    const requests = await CoachRequest.find({ coachId: coachProfile._id })
      .populate("athleteId", "name sport level age profileImage location email phone")
      .sort({ createdAt: -1 });
    
    console.log("📨 Requests found:", requests.length);
    
    res.status(200).json({
      success: true,
      requests: requests
    });
    
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching requests", 
      error: error.message 
    });
  }
};

// 🟡 Accept or reject request - FIXED
const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const coachUserId = req.user.id;

    console.log("🔄 Updating request:", { requestId, status, coachUserId });

    // Find coach profile first
    const coachProfile = await CoachProfile.findOne({ coachId: coachUserId });
    
    if (!coachProfile) {
      return res.status(404).json({ 
        success: false,
        message: "Coach profile not found" 
      });
    }

    // Verify the request belongs to this coach's PROFILE
    const request = await CoachRequest.findOne({
      _id: requestId,
      coachId: coachProfile._id // Use profile ID, not user ID
    });

    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: "Request not found or doesn't belong to you" 
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ 
        success: false,
        message: `Request is already ${request.status}` 
      });
    }

    const updated = await CoachRequest.findByIdAndUpdate(
      requestId,
      { 
        status,
        respondedAt: new Date()
      },
      { new: true }
    ).populate("athleteId", "name sport level");

    console.log("✅ Request updated to:", status);

    res.status(200).json({ 
      success: true,
      message: `Request ${status} successfully`, 
      request: updated 
    });
    
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating request", 
      error: error.message 
    });
  }
};

// 🟢 Get coach's accepted athletes - FIXED
const getAcceptedAthletes = async (req, res) => {
  try {
    const coachUserId = req.user.id;
    
    // Find coach profile first
    const coachProfile = await CoachProfile.findOne({ coachId: coachUserId });
    
    if (!coachProfile) {
      return res.status(404).json({ 
        success: false,
        message: "Coach profile not found" 
      });
    }

    const acceptedRequests = await CoachRequest.find({
      coachId: coachProfile._id, // Use profile ID, not user ID
      status: "accepted"
    })
    .populate("athleteId", "name sport level profileImage email phone")
    .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      athletes: acceptedRequests
    });
    
  } catch (error) {
    console.error("Error fetching accepted athletes:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching accepted athletes", 
      error: error.message 
    });
  }
};

module.exports = {
  getCoachRequests,
  updateRequestStatus,
  getAcceptedAthletes
};