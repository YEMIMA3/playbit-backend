const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Athlete = require('../../models/authentication/athlete');

// Configure email transporter - FIXED: createTransport not createTransporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'ayurcure63@gmail.com',
    pass: process.env.EMAIL_PASS // Use App Password from Gmail
  }
});

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

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Athlete Platform" <${process.env.EMAIL_USER || 'playbit45@gmail.com'}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to: ${to}, Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
};

// 🟢 Athlete Registration
const registerAthlete = async (req, res) => {
  try {
    const { name, email, password, sport, experience, achievements, phone, location, dateOfBirth } = req.body;

    // Validation - Check required fields
    if (!name || !email || !password || !sport || !experience) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: name, email, password, sport, experience"
      });
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
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

    // Create new athlete with role
    const athlete = new Athlete({
      name,
      email,
      password,
      sport,
      experience,
      achievements: achievements || [],
      phone: phone || '',
      location: location || '',
      dateOfBirth: dateOfBirth || null,
      role: 'athlete', // Explicitly set role
      isCertified: true
    });

    await athlete.save();

    // Generate JWT token
    const token = generateToken(athlete._id);

    // Send welcome email
    try {
      await sendEmail(
        email,
        'Welcome to Athlete Platform! 🎉',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb; text-align: center;">Welcome to Our Athlete Platform!</h1>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your athlete account has been successfully created with the following details:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Sport:</strong> ${sport}</p>
              <p><strong>Experience Level:</strong> ${experience} years</p>
              <p><strong>Email:</strong> ${email}</p>
            </div>
            <p>You can now login to your account and start exploring all the features available to athletes.</p>
            <p>If you have any questions, feel free to contact our support team.</p>
            <br>
            <p>Best regards,<br>The Athlete Platform Team</p>
          </div>
        `
      );
    } catch (emailError) {
      console.log('Welcome email failed to send, but registration completed');
    }

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
        role: athlete.role,
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
        isVerified: athlete.isVerified,
        role: athlete.role
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

// 🟢 Enhanced Forgot Password with Email
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
    
    // For security, don't reveal whether email exists or not
    if (!athlete) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, a password reset link has been sent to your email"
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token and set expiry (1 hour)
    athlete.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    athlete.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    
    await athlete.save();

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || req.protocol + '://' + req.get('host')}/reset-password/${resetToken}`;

    // Email content
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb; text-align: center;">Password Reset Request</h1>
        <p>Hello <strong>${athlete.name}</strong>,</p>
        <p>You requested a password reset for your athlete account.</p>
        <p>Click the button below to reset your password. This link will expire in <strong>1 hour</strong>:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
            Reset Your Password
          </a>
        </div>

        <p>Or copy and paste this link in your browser:</p>
        <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">
          ${resetUrl}
        </p>

        <p><strong>Reset Token:</strong> ${resetToken}</p>

        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request this password reset, please ignore this email. Your account remains secure.
        </p>

        <br>
        <p>Best regards,<br>The Athlete Platform Team</p>
      </div>
    `;

    // Send email
    const emailSent = await sendEmail(
      email,
      'Password Reset Request - Athlete Account',
      message
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Email could not be sent. Please try again later.",
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset link has been sent to your email",
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined // For testing only
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing password reset"
    });
  }
};

// 🟢 Enhanced Reset Password
const resetPassword = async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { newPassword, email } = req.body;

    if (!newPassword || !email) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find athlete with valid reset token
    const athlete = await Athlete.findOne({
      email: email,
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!athlete) {
      return res.status(400).json({
        success: false,
        message: "Invalid, expired reset token, or email mismatch"
      });
    }

    // Update password and clear reset token
    athlete.password = newPassword;
    athlete.resetPasswordToken = undefined;
    athlete.resetPasswordExpire = undefined;
    await athlete.save();

    // Send confirmation email
    try {
      await sendEmail(
        email,
        'Password Reset Successful ✅',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981; text-align: center;">Password Reset Successful</h1>
            <p>Hello <strong>${athlete.name}</strong>,</p>
            <p>Your password has been successfully reset.</p>
            <div style="background-color: #d1fae5; color: #065f46; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Account:</strong> ${email}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>If you did not perform this action, please contact our support team immediately.</p>
            <br>
            <p>Best regards,<br>The Athlete Platform Team</p>
          </div>
        `
      );
    } catch (emailError) {
      console.log('Confirmation email failed to send, but password was reset');
    }

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

// 🟢 Enhanced Verify Email
const verifyEmail = async (req, res) => {
  try {
    const { verificationToken } = req.params;

    // Find athlete by verification token
    const athlete = await Athlete.findOne({
      emailVerificationToken: verificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!athlete) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token"
      });
    }

    athlete.isVerified = true;
    athlete.emailVerificationToken = undefined;
    athlete.emailVerificationExpire = undefined;
    await athlete.save();

    // Send welcome email after verification
    try {
      await sendEmail(
        athlete.email,
        'Email Verified Successfully! 🎉',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981; text-align: center;">Email Verified Successfully!</h1>
            <p>Hello <strong>${athlete.name}</strong>,</p>
            <p>Your email has been successfully verified. Welcome to our platform!</p>
            <p>You now have full access to all athlete features.</p>
            <br>
            <p>Best regards,<br>The Athlete Platform Team</p>
          </div>
        `
      );
    } catch (emailError) {
      console.log('Welcome email after verification failed to send');
    }

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

// 🟢 Enhanced Resend Verification Email
const resendVerificationEmail = async (req, res) => {
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
      return res.status(404).json({
        success: false,
        message: "Athlete not found"
      });
    }

    if (athlete.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified"
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    athlete.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    athlete.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await athlete.save();

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL || req.protocol + '://' + req.get('host')}/verify-email/${verificationToken}`;
    
    const emailSent = await sendEmail(
      email,
      'Verify Your Email - Athlete Account',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Verify Your Email</h1>
          <p>Hello <strong>${athlete.name}</strong>,</p>
          <p>Please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
              Verify Email
            </a>
          </div>

          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account with us, please ignore this email.</p>
          <br>
          <p>Best regards,<br>The Athlete Platform Team</p>
        </div>
      `
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Verification email could not be sent"
      });
    }

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
        role: athlete.role,
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