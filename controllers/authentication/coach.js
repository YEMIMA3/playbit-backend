const jwt = require('jsonwebtoken');
const CoachCredentials = require('../../models/authentication/coach');

// 🟢 Coach Registration
const registerCoach = async (req, res) => {
  try {
    const { name, email, password, phone, location, sport, experience } = req.body;

    // Check if coach already exists
    const existingCoach = await CoachCredentials.findOne({ email });
    if (existingCoach) {
      return res.status(400).json({
        success: false,
        message: "Coach already exists with this email"
      });
    }

    // Create new coach
    const coach = new CoachCredentials({
      name,
      email,
      password,
      phone,
      location,
      sport,
      experience
    });

    await coach.save();

    // Generate token
    const token = jwt.sign(
      { 
        id: coach._id, 
        email: coach.email,
        type: 'coach'
      },
      process.env.JWT_SECRET || 'coach_secret_fallback_12345',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: "Coach registered successfully",
      token,
      coach: {
        id: coach._id,
        name: coach.name,
        email: coach.email,
        phone: coach.phone,
        location: coach.location,
        sport: coach.sport,
        experience: coach.experience
      }
    });

  } catch (error) {
    console.error("Coach registration error:", error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration"
    });
  }
};

// 🟢 Coach Login
const loginCoach = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find coach
    const coach = await CoachCredentials.findOne({ email });
    if (!coach) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Verify password
    const isMatch = await coach.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check account status
    if (coach.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: "Your account is not active. Please contact support."
      });
    }

    // Update last login
    coach.lastLogin = new Date();
    await coach.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: coach._id, 
        email: coach.email,
        type: 'coach'
      },
      process.env.JWT_SECRET || 'coach_secret_fallback_12345',
      { expiresIn: '30d' }
    );

    // Successful response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      coach: {
        id: coach._id,
        name: coach.name,
        email: coach.email,
        phone: coach.phone,
        location: coach.location,
        sport: coach.sport,
        experience: coach.experience,
        lastLogin: coach.lastLogin
      }
    });

  } catch (error) {
    console.error("Coach login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
};

// 🟢 Get Coach Profile (for authentication)
const getCoachProfile = async (req, res) => {
  try {
    const coach = await CoachCredentials.findById(req.user.id).select('-password');
    
    if (!coach) {
      return res.status(404).json({
        success: false,
        message: "Coach not found"
      });
    }

    res.status(200).json({
      success: true,
      coach: {
        id: coach._id,
        name: coach.name,
        email: coach.email,
        phone: coach.phone,
        location: coach.location,
        sport: coach.sport,
        experience: coach.experience,
        lastLogin: coach.lastLogin,
        status: coach.status
      }
    });

  } catch (error) {
    console.error("Get coach profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile"
    });
  }
};

module.exports = {
  registerCoach,
  loginCoach,
  getCoachProfile
};