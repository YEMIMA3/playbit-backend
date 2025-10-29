const jwt = require("jsonwebtoken");
const CoachCredentials = require("../../models/authentication/coach.js");

const protectCoach = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret');

    const coach = await CoachCredentials.findById(decoded.id).select("-password");
    if (!coach) {
      return res.status(404).json({ success: false, message: "Coach not found" });
    }

    if (coach.status !== "active") {
      return res.status(403).json({ success: false, message: "Coach not active" });
    }

    req.user = coach;
    next();
  } catch (err) {
    console.error("Authentication error:", err.message);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

module.exports = { protectCoach };