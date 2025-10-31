const jwt = require("jsonwebtoken");
const CoachCredentials = require("../../models/authentication/coach.js");

const protectCoach = async (req, res, next) => {
  try {
    console.log('🔐 ProtectCoach - Headers:', req.headers.authorization);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1].trim();
    console.log('🔐 Token:', token);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret');
    console.log('🔐 Decoded token:', decoded);

    // Check if we have the right field (id or _id)
    const coachId = decoded.id || decoded._id;
    if (!coachId) {
      console.log('❌ No coach ID in token');
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    console.log('🔐 Looking for coach with ID:', coachId);
    
    // Find coach
    const coach = await CoachCredentials.findById(coachId).select("-password");
    if (!coach) {
      console.log('❌ Coach not found in database for ID:', coachId);
      return res.status(404).json({ success: false, message: "Coach not found" });
    }

    if (coach.status !== "active") {
      return res.status(403).json({ success: false, message: "Coach not active" });
    }

    console.log('✅ Coach found:', coach.email);
    
    // Set both for compatibility
    req.user = coach;
    req.coach = coach;
    
    next();
  } catch (err) {
    console.error("❌ Authentication error:", err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: "Invalid token signature" });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    
    res.status(401).json({ success: false, message: "Authentication failed" });
  }
};

module.exports = { protectCoach };