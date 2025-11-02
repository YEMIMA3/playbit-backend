const Athlete = require('../../models/authentication/athlete');
const AthleteProfile = require('../../models/athlete/athleteprofile');
const jwt = require('jsonwebtoken');

// 🟢 Athlete Login
const loginAthlete = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    // 1. Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }

    // 2. Check if athlete exists
    const athlete = await Athlete.findOne({ email }).select('+password');
    
    if (!athlete) {
      console.log('❌ Athlete not found:', email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 3. Check if password is correct
    const isPasswordCorrect = await athlete.matchPassword(password);
    
    if (!isPasswordCorrect) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 4. Check if athlete profile exists
    const profileExists = await AthleteProfile.findOne({ athleteId: athlete._id });
    console.log('📊 Profile exists:', profileExists ? 'Yes' : 'No');

    // 5. Create token
    const token = jwt.sign(
      { 
        id: athlete._id,
        email: athlete.email,
        role: athlete.role 
      },
      process.env.JWT_SECRET || 'athlete_secret_fallback_12345',
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    // 6. Update last login
    athlete.lastLogin = new Date();
    await athlete.save();

    console.log('✅ Login successful for:', athlete.email);

    // 7. Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      athlete: {
        id: athlete._id,
        name: athlete.name,
        email: athlete.email,
        sport: athlete.sport,
        experience: athlete.experience,
        phone: athlete.phone || '',
        location: athlete.location || '',
        dateOfBirth: athlete.dateOfBirth || '',
        profileImage: athlete.profileImage || '',
        achievements: athlete.achievements || [],
        role: athlete.role,
        isVerified: athlete.isVerified
      },
      hasProfile: !!profileExists
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message
    });
  }
};

// 🟢 Athlete Signup
const signupAthlete = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      sport,
      experience,
      phone,
      location,
      dateOfBirth
    } = req.body;

    console.log('🆕 Signup attempt for:', email);

    // 1. Check if all required fields are provided
    if (!name || !email || !password || !sport || !experience) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: name, email, password, sport, experience"
      });
    }

    // 2. Check if athlete already exists
    const existingAthlete = await Athlete.findOne({ email });
    if (existingAthlete) {
      return res.status(409).json({
        success: false,
        message: "Athlete already exists with this email"
      });
    }

    // 3. Create new athlete
    const athlete = await Athlete.create({
      name,
      email,
      password,
      sport,
      experience,
      phone: phone || '',
      location: location || '',
      dateOfBirth: dateOfBirth || null
    });

    console.log('✅ Athlete created:', athlete.email);

    // 4. Create token
    const token = jwt.sign(
      { 
        id: athlete._id,
        email: athlete.email,
        role: athlete.role 
      },
      process.env.JWT_SECRET || 'athlete_secret_fallback_12345',
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    // 5. Send response
    res.status(201).json({
      success: true,
      message: "Athlete registered successfully",
      token,
      athlete: {
        id: athlete._id,
        name: athlete.name,
        email: athlete.email,
        sport: athlete.sport,
        experience: athlete.experience,
        phone: athlete.phone || '',
        location: athlete.location || '',
        dateOfBirth: athlete.dateOfBirth || '',
        role: athlete.role,
        isVerified: athlete.isVerified
      },
      hasProfile: false
    });

  } catch (error) {
    console.error("❌ Signup error:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Athlete already exists with this email"
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
      message: "Server error during registration",
      error: error.message
    });
  }
};

module.exports = {
  loginAthlete,
  signupAthlete
};