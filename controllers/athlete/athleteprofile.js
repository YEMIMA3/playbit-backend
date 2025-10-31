const AthleteProfile = require('../../models/athlete/athleteprofile');
const Athlete = require('../../models/authentication/athlete');

// 🟢 Get Athlete Profile
const getAthleteProfile = async (req, res) => {
  try {
    console.log('🔍 Getting athlete profile for:', req.athlete?.id);
    console.log('👤 Athlete details:', req.athlete?.email);
    
    if (!req.athlete || !req.athlete.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const athleteId = req.athlete.id;

    let profile = await AthleteProfile.findOne({ athleteId })
      .populate('athleteId', 'email name sport experience achievements');

    console.log('📊 Found profile:', profile ? 'Yes' : 'No');

    // If profile doesn't exist, create one with basic athlete data
    if (!profile) {
      console.log('🆕 Creating new profile for athlete');
      const athlete = await Athlete.findById(athleteId);
      
      if (!athlete) {
        return res.status(404).json({
          success: false,
          message: "Athlete not found"
        });
      }

      profile = new AthleteProfile({
        athleteId: athlete._id,
        name: athlete.name || 'Athlete',
        email: athlete.email,
        sport: athlete.sport || 'General',
        level: 'Intermediate',
        bio: '',
        achievements: []
      });

      await profile.save();
      console.log('✅ New profile created for:', athlete.email);
    }

    res.status(200).json({
      success: true,
      profile: {
        id: profile._id,
        athleteId: profile.athleteId,
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        location: profile.location || '',
        sport: profile.sport,
        level: profile.level,
        bio: profile.bio || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : '',
        height: profile.height || '',
        weight: profile.weight || '',
        profileImage: profile.profileImage || '',
        achievements: profile.achievements || [],
        isProfileComplete: profile.isProfileComplete || false,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      }
    });

  } catch (error) {
    console.error("❌ Get athlete profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
      error: error.message
    });
  }
};

// 🟢 Update Athlete Profile
const updateAthleteProfile = async (req, res) => {
  try {
    const athleteId = req.athlete.id;
    const {
      name,
      phone,
      location,
      sport,
      level,
      bio,
      dateOfBirth,
      height,
      weight,
      profileImage
    } = req.body;

    console.log('📝 Updating profile for:', athleteId);

    // Check if required fields are present
    if (!name || !sport) {
      return res.status(400).json({
        success: false,
        message: "Name and sport are required fields"
      });
    }

    let profile = await AthleteProfile.findOne({ athleteId });

    if (!profile) {
      // Create new profile if it doesn't exist
      profile = new AthleteProfile({
        athleteId,
        name,
        email: req.athlete.email,
        phone: phone || '',
        location: location || '',
        sport,
        level: level || 'Intermediate',
        bio: bio || '',
        dateOfBirth: dateOfBirth || null,
        height: height || '',
        weight: weight || '',
        profileImage: profileImage || '',
        isProfileComplete: true
      });
    } else {
      // Update existing profile
      profile.name = name;
      profile.phone = phone || '';
      profile.location = location || '';
      profile.sport = sport;
      profile.level = level || 'Intermediate';
      profile.bio = bio || '';
      profile.dateOfBirth = dateOfBirth || null;
      profile.height = height || '';
      profile.weight = weight || '';
      profile.profileImage = profileImage || '';
      profile.isProfileComplete = true;
    }

    await profile.save();

    // Also update the main athlete record
    await Athlete.findByIdAndUpdate(athleteId, {
      name,
      sport
    });

    console.log('✅ Profile updated successfully for:', athleteId);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        id: profile._id,
        athleteId: profile.athleteId,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        sport: profile.sport,
        level: profile.level,
        bio: profile.bio,
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : '',
        height: profile.height,
        weight: profile.weight,
        profileImage: profile.profileImage,
        achievements: profile.achievements,
        isProfileComplete: profile.isProfileComplete
      }
    });

  } catch (error) {
    console.error("❌ Update athlete profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
      error: error.message
    });
  }
};

// 🟢 Upload Achievement/Certificate
const uploadAchievement = async (req, res) => {
  try {
    const athleteId = req.athlete.id;
    const { type, fileName, fileUrl, fileSize } = req.body;

    if (!type || !fileName || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: "Type, fileName, and fileUrl are required"
      });
    }

    const profile = await AthleteProfile.findOne({ athleteId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found. Please complete your profile first."
      });
    }

    const newAchievement = {
      type,
      fileName,
      fileUrl,
      fileSize: fileSize || '0 MB',
      uploadDate: new Date()
    };

    profile.achievements.push(newAchievement);
    await profile.save();

    res.status(201).json({
      success: true,
      message: "Achievement uploaded successfully",
      achievement: newAchievement
    });

  } catch (error) {
    console.error("❌ Upload achievement error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading achievement"
    });
  }
};

// 🟢 Delete Achievement
const deleteAchievement = async (req, res) => {
  try {
    const athleteId = req.athlete.id;
    const { achievementId } = req.params;

    const profile = await AthleteProfile.findOne({ athleteId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    // Find and remove the achievement
    const achievementIndex = profile.achievements.findIndex(
      achievement => achievement._id.toString() === achievementId
    );

    if (achievementIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found"
      });
    }

    profile.achievements.splice(achievementIndex, 1);
    await profile.save();

    res.status(200).json({
      success: true,
      message: "Achievement deleted successfully"
    });

  } catch (error) {
    console.error("❌ Delete achievement error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting achievement"
    });
  }
};

// 🟢 Upload Profile Image
const uploadProfileImage = async (req, res) => {
  try {
    const athleteId = req.athlete.id;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required"
      });
    }

    const profile = await AthleteProfile.findOne({ athleteId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    profile.profileImage = imageUrl;
    await profile.save();

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: imageUrl
    });

  } catch (error) {
    console.error("❌ Upload profile image error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading profile image"
    });
  }
};

module.exports = {
  getAthleteProfile,
  updateAthleteProfile,
  uploadAchievement,
  deleteAchievement,
  uploadProfileImage
};