const CoachProfile = require("../../models/coach/coachProfile");
const CoachCredentials = require("../../models/authentication/coach");

// 🟢 Get coach profile - creates one if doesn't exist with signup data
const getCoachProfile = async (req, res) => {
  try {
    let profile = await CoachProfile.findOne({ coachId: req.user.id });

    if (!profile) {
      // Create profile with signup data
      profile = new CoachProfile({
        coachId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        location: req.user.location,
        sports: [req.user.sport],
        experience: req.user.experience,
        bio: "",
        certifications: [],
        hourlyRate: "",
        availability: "",
        achievements: [],
        profileImage: ""
      });
      await profile.save();
    }

    res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("Error fetching coach profile:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// 🔵 Update coach profile
const updateCoachProfile = async (req, res) => {
  try {
    const profile = await CoachProfile.findOneAndUpdate(
      { coachId: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile,
    });
  } catch (err) {
    console.error("Error updating coach profile:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

module.exports = {
  getCoachProfile,
  updateCoachProfile,
};