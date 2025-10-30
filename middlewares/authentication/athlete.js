const jwt = require('jsonwebtoken');
const Athlete = require('../../models/authentication/athlete');

// Protect routes - verify JWT token for athletes only
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies (alternative method)
    else if (req.cookies && req.cookies.athlete_token) {
      token = req.cookies.athlete_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'athlete_secret_fallback_12345');
      
      // Find athlete by ID
      const athlete = await Athlete.findById(decoded.id).select('-password');

      if (!athlete) {
        return res.status(401).json({
          success: false,
          message: 'Athlete not found'
        });
      }

      // Check if account is active
      if (athlete.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Your athlete account is not active. Please contact support.'
        });
      }

      // Attach athlete to request object
      req.athlete = {
        id: athlete._id,
        email: athlete.email,
        name: athlete.name,
        sport: athlete.sport,
        isVerified: athlete.isVerified
      };
      
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token'
      });
    }
  } catch (error) {
    console.error('Athlete auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Require athlete role (additional check)
const requireAthlete = (req, res, next) => {
  if (req.athlete) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Athlete privileges required.'
    });
  }
};

// Check if athlete is verified
const requireVerified = (req, res, next) => {
  if (req.athlete && req.athlete.isVerified) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this resource.'
    });
  }
};

// Optional auth - doesn't block but adds athlete info if available
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.athlete_token) {
      token = req.cookies.athlete_token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'athlete_secret_fallback_12345');
      const athlete = await Athlete.findById(decoded.id).select('-password');
      
      if (athlete && athlete.status === 'active') {
        req.athlete = {
          id: athlete._id,
          email: athlete.email,
          name: athlete.name,
          sport: athlete.sport,
          isVerified: athlete.isVerified
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without athlete info if token is invalid
    next();
  }
};

// Rate limiting for athlete endpoints (simple version)
const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [key, timestamp] of requests.entries()) {
      if (timestamp < windowStart) {
        requests.delete(key);
      }
    }

    // Check current requests
    const currentRequests = Array.from(requests.values()).filter(time => time > windowStart).length;

    if (currentRequests >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    // Add current request
    requests.set(ip, now);

    next();
  };
};

module.exports = {
  protect,
  requireAthlete,
  requireVerified,
  optionalAuth,
  rateLimit
};