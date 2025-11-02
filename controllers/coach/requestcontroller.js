const CoachRequest = require("../../models/athlete/coachrequest.js");

// 🟢 Get all requests for a coach
const getCoachRequests = async (req, res) => {
  try {
    const coachId = req.user.id;
    const requests = await CoachRequest.find({ coachId })
      .populate("athleteId", "name sport level age profileImage")
      .sort({ createdAt: -1 });
    
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ message: "Error fetching requests", error: error.message });
  }
};

// 🟡 Accept or reject request
const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // "accepted" or "rejected"
    const coachId = req.user.id;

    // Verify the request belongs to this coach
    const request = await CoachRequest.findOne({
      _id: requestId,
      coachId: coachId
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ 
        message: `Request is already ${request.status}` 
      });
    }

    const updated = await CoachRequest.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    ).populate("athleteId", "name sport level");

    res.status(200).json({ 
      message: `Request ${status} successfully`, 
      updated 
    });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ message: "Error updating request", error: error.message });
  }
};

// 🟢 Get coach's accepted athletes
const getAcceptedAthletes = async (req, res) => {
  try {
    const coachId = req.user.id;
    
    const acceptedRequests = await CoachRequest.find({
      coachId: coachId,
      status: "accepted"
    })
    .populate("athleteId", "name sport level profileImage")
    .sort({ updatedAt: -1 });

    res.status(200).json(acceptedRequests);
  } catch (error) {
    console.error("Error fetching accepted athletes:", error);
    res.status(500).json({ message: "Error fetching accepted athletes", error: error.message });
  }
};

module.exports = {
  getCoachRequests,
  updateRequestStatus,
  getAcceptedAthletes
};