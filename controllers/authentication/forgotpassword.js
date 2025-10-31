const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Athlete = require('../../models/authentication/athlete');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'playbit45@gmail.com',
    pass: process.env.EMAIL_PASSWORD // Use App Password for Gmail
  }
});

// 🟢 Forgot Password - Send Reset Email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    console.log('🔐 Forgot password request for:', email);

    // Find athlete by email
    const athlete = await Athlete.findOne({ email });
    
    if (!athlete) {
      // For security, don't reveal if email exists or not
      console.log('📧 Email not found in database:', email);
      return res.status(200).json({
        success: true,
        message: "If your email is registered, you will receive a password reset link"
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token and expiry (1 hour)
    athlete.resetPasswordToken = resetPasswordToken;
    athlete.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    await athlete.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/athlete/reset-password/${resetToken}`;

    // Email content
    const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
            font-weight: bold;
          }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚡ PlayBit Sports</h1>
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Hello <strong>${athlete.name}</strong>,</p>
            <p>You are receiving this email because you requested a password reset for your PlayBit Sports account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Your Password</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <div class="warning">
              <p><strong>⚠️ This link will expire in 1 hour.</strong></p>
            </div>
            <p>If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PlayBit Sports. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Send email
      await transporter.sendMail({
        from: `"PlayBit Sports" <${process.env.EMAIL_USER || 'playbit45@gmail.com'}>`,
        to: athlete.email,
        subject: '🔐 PlayBit Sports - Password Reset Request',
        html: message
      });

      console.log(`✅ Password reset email sent to: ${athlete.email}`);

      res.status(200).json({
        success: true,
        message: "Password reset email sent successfully"
      });

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      
      // Clear the reset token if email fails
      athlete.resetPasswordToken = undefined;
      athlete.resetPasswordExpire = undefined;
      await athlete.save();

      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again."
      });
    }

  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing password reset"
    });
  }
};

// 🟢 Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    console.log('🔄 Processing password reset with token');

    // Hash the token to compare with stored token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find athlete with valid token and not expired
    const athlete = await Athlete.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!athlete) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Update password
    athlete.password = password;
    athlete.resetPasswordToken = undefined;
    athlete.resetPasswordExpire = undefined;

    await athlete.save();

    console.log(`✅ Password reset successful for: ${athlete.email}`);

    // Send confirmation email
    const confirmationMessage = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚡ PlayBit Sports</h1>
            <h2>Password Reset Successful</h2>
          </div>
          <div class="content">
            <p>Hello <strong>${athlete.name}</strong>,</p>
            <p>Your PlayBit Sports account password has been successfully reset.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
            <p>Thank you for using PlayBit Sports!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PlayBit Sports. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"PlayBit Sports" <${process.env.EMAIL_USER || 'playbit45@gmail.com'}>`,
      to: athlete.email,
      subject: '✅ PlayBit Sports - Password Reset Successful',
      html: confirmationMessage
    });

    res.status(200).json({
      success: true,
      message: "Password reset successful"
    });

  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resetting password"
    });
  }
};

module.exports = {
  forgotPassword,
  resetPassword
};