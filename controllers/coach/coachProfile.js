const CoachProfile = require('../../models/coach/coachProfile');
const Coach = require('../../models/authentication/coach'); // Your coachcredentials model

// 🟢 Get coach profile
const getCoachProfile = async (req, res) => {
  try {
    console.log('🔍 Fetching profile for coach ID:', req.coach.id);

    // First, get the coach basic info from coachcredentials
    const coach = await Coach.findById(req.coach.id);
    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found in credentials'
      });
    }
    console.log('✅ Found coach credentials:', coach.email);

    // Find coach profile
    let coachProfile = await CoachProfile.findOne({ coachId: req.coach.id });
    console.log('📋 Coach profile found:', !!coachProfile);
    
    if (!coachProfile) {
      console.log('🆕 Creating new coach profile...');
      // Create a new profile with data from coach credentials
      coachProfile = new CoachProfile({
        coachId: req.coach.id,
        name: coach.name,
        email: coach.email,
        phone: coach.phone,
        location: coach.location,
        sports: coach.sport ? [coach.sport] : [],
        experience: coach.experience,
        bio: coach.bio,
        certifications: coach.certifications || [],
        hourlyRate: coach.hourlyRate,
        availability: coach.availability,
        achievements: coach.achievements || [],
        profileImage: coach.profilePicture
      });
      
      await coachProfile.save();
      console.log('✅ Created new coach profile');
    }

    // Prepare response data - merge profile data with coach data
    const responseData = {
      // Basic info from profile (preferred) or coach
      name: coachProfile.name || coach.name,
      email: coachProfile.email || coach.email,
      phone: coachProfile.phone || coach.phone,
      location: coachProfile.location || coach.location,
      
      // Arrays - use profile if available and not empty, otherwise use coach data
      sports: (coachProfile.sports && coachProfile.sports.length > 0) 
        ? coachProfile.sports 
        : (coach.sport ? [coach.sport] : []),
      
      certifications: (coachProfile.certifications && coachProfile.certifications.length > 0)
        ? coachProfile.certifications
        : (coach.certifications || []),
      
      achievements: (coachProfile.achievements && coachProfile.achievements.length > 0)
        ? coachProfile.achievements
        : (coach.achievements || []),
      
      // Other fields
      experience: coachProfile.experience || coach.experience,
      bio: coachProfile.bio || coach.bio,
      hourlyRate: coachProfile.hourlyRate || coach.hourlyRate,
      availability: coachProfile.availability || coach.availability,
      profileImage: coachProfile.profileImage || coach.profilePicture
    };

    console.log('📤 Sending profile data:', {
      name: responseData.name,
      email: responseData.email,
      sports: responseData.sports,
      experience: responseData.experience
    });

    res.json({
      success: true,
      profile: responseData
    });

  } catch (error) {
    console.error('❌ Error fetching coach profile:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Profile synchronization issue'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile: ' + error.message
    });
  }
};

// 🔵 Update coach profile
const updateCoachProfile = async (req, res) => {
  try {
    const {
      name, email, phone, location, sports, experience, bio,
      certifications, hourlyRate, availability, achievements, profileImage
    } = req.body;

    console.log('🔄 Updating profile for coach ID:', req.coach.id);
    console.log('📝 Update data:', {
      name, email, sports, experience
    });

    // Find existing profile or create new one
    let coachProfile = await CoachProfile.findOne({ coachId: req.coach.id });
    
    if (!coachProfile) {
      console.log('🆕 Creating new profile for update...');
      // Get coach basic info first
      const coach = await Coach.findById(req.coach.id);
      if (!coach) {
        return res.status(404).json({
          success: false,
          message: 'Coach not found'
        });
      }

      coachProfile = new CoachProfile({
        coachId: req.coach.id,
        name: coach.name,
        email: coach.email,
        phone: coach.phone,
        location: coach.location,
        sports: coach.sport ? [coach.sport] : [],
        experience: coach.experience,
        bio: coach.bio,
        certifications: coach.certifications || [],
        hourlyRate: coach.hourlyRate,
        availability: coach.availability,
        achievements: coach.achievements || [],
        profileImage: coach.profilePicture
      });
    }

    // Update fields if provided
    const updateFields = {
      name, email, phone, location, sports, experience, bio,
      certifications, hourlyRate, availability, achievements, profileImage
    };

    Object.keys(updateFields).forEach(field => {
      if (updateFields[field] !== undefined) {
        console.log(`📝 Updating ${field}:`, updateFields[field]);
        coachProfile[field] = updateFields[field];
      }
    });

    await coachProfile.save();
    console.log('✅ Profile updated successfully');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: coachProfile
    });

  } catch (error) {
    console.error('❌ Error updating coach profile:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate profile detected'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + Object.values(error.errors).map(e => e.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile: ' + error.message
    });
  }
};

module.exports = {
  getCoachProfile,
  updateCoachProfile
};