const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Athlete = require('../../models/authentication/athlete');

// Generate JWT token for athlete
const generateToken = (athleteId) => {
  return jwt.sign(
    { 
      id: athleteId,
      type: 'athlete'
    },
    process.env.JWT_SECRET || 'athlete_secret_fallback_12345',
    { expiresIn: '30d' }
  );
};

// 🟢 Athlete Registration
const registerAthlete = async (req, res) => {
  try {
    const { name, email, password, sport, experience, achievements } = req.body;

    // Validation - Check required fields
    if (!name || !email || !password || !sport || !experience) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: name, email, password, sport, experience"
      });
    }

    // Check if athlete already exists
    const existingAthlete = await Athlete.findOne({ email });
    if (existingAthlete) {
      return res.status(400).json({
        success: false,
        message: "Athlete already exists with this email"
      });
    }

    // Create new athlete
    const athlete = new Athlete({
      name,
      email,
      password,
      sport,
      experience,
      achievements: achievements || '',
      isCertified: true
    });

    await athlete.save();

    // Generate JWT token
    const token = generateToken(athlete._id);

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
        achievements: athlete.achievements,
        isVerified: athlete.isVerified
      }
    });

  } catch (error) {
    console.error("Athlete registration error:", error);
    
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

// 🟢 Athlete Login
const loginAthlete = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find athlete
    const athlete = await Athlete.findOne({ email });
    if (!athlete) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Verify password
    const isMatch = await athlete.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check account status
    if (athlete.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: "Your account is not active. Please contact support."
      });
    }

    // Update last login
    athlete.lastLogin = new Date();
    await athlete.save();

    // Generate JWT token
    const token = generateToken(athlete._id);

    // Successful response
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
        achievements: athlete.achievements,
        lastLogin: athlete.lastLogin,
        isVerified: athlete.isVerified
      }
    });

  } catch (error) {
    console.error("Athlete login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
};

// 🟢 Get Athlete Profile
const getAthleteProfile = async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.athlete.id);
    
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: "Athlete not found"
      });
    }

    res.status(200).json({
      success: true,
      athlete: {
        id: athlete._id,
        name: athlete.name,
        email: athlete.email,
        sport: athlete.sport,
        experience: athlete.experience,
        achievements: athlete.achievements,
        lastLogin: athlete.lastLogin,
        status: athlete.status,
        isVerified: athlete.isVerified,
        createdAt: athlete.createdAt
      }
    });

  } catch (error) {
    console.error("Get athlete profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile"
    });
  }
};

// 🟢 Update Athlete Profile
const updateAthleteProfile = async (req, res) => {
  try {
    const { name, sport, experience, achievements } = req.body;
    
    const athlete = await Athlete.findByIdAndUpdate(
      req.athlete.id,
      {
        name,
        sport,
        experience,
        achievements
      },
      { new: true, runValidators: true }
    );

    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: "Athlete not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      athlete: {
        id: athlete._id,
        name: athlete.name,
        email: athlete.email,
        sport: athlete.sport,
        experience: athlete.experience,
        achievements: athlete.achievements
      }
    });

  } catch (error) {
    console.error("Update athlete profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile"
    });
  }
};

// 🟢 Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    const athlete = await Athlete.findById(req.athlete.id);
    
    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: "Athlete not found"
      });
    }

    // Verify current password
    const isMatch = await athlete.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Update password
    athlete.password = newPassword;
    await athlete.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while changing password"
    });
  }
};

// 🟢 Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const athlete = await Athlete.findOne({ email });
    
    if (!athlete) {
      // Don't reveal whether email exists or not
      return res.status(200).json({
        success: true,
        message: "If the email exists, a password reset link has been sent"
      });
    }

    // Generate reset token (simple version for demo)
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // In production, you would save this to the database and send email
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: "If the email exists, a password reset link has been sent",
      resetToken: resetToken // Remove this in production, only for testing
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing password reset"
    });
  }
};

// 🟢 Reset Password
const resetPassword = async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required"
      });
    }

    // In production, you would verify the token from database
    // For demo, we'll just accept any token
    console.log(`Reset password with token: ${resetToken}`);

    // Find athlete by email or other method in production
    const athlete = await Athlete.findOne({ email: req.body.email });
    
    if (!athlete) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token"
      });
    }

    // Update password
    athlete.password = newPassword;
    await athlete.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resetting password"
    });
  }
};

// 🟢 Verify Email (placeholder)
const verifyEmail = async (req, res) => {
  try {
    const { verificationToken } = req.params;

    // In production, you would verify the token
    console.log(`Verify email with token: ${verificationToken}`);

    res.status(200).json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while verifying email"
    });
  }
};

// 🟢 Resend Verification Email (placeholder)
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    console.log(`Resend verification email to: ${email}`);

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully"
    });

  } catch (error) {
    console.error("Resend verification email error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending verification email"
    });
  }
};

// 🟢 Delete Account
const deleteAccount = async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.athlete.id);

    if (!athlete) {
      return res.status(404).json({
        success: false,
        message: "Athlete not found"
      });
    }

    await Athlete.findByIdAndDelete(req.athlete.id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully"
    });

  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting account"
    });
  }
};

module.exports = {
  registerAthlete,
  loginAthlete,
  getAthleteProfile,
  updateAthleteProfile,
  deleteAccount,            
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail
};