const jwt = require('jsonwebtoken');
const Athlete = require('../../models/authentication/athlete');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - No token'
      });
    }

    try {
      // Verify token with consistent secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'athlete_secret_fallback_12345');
      
      // Get athlete from token
      const athlete = await Athlete.findById(decoded.id).select('-password');
      
      if (!athlete) {
        return res.status(401).json({
          success: false,
          message: 'Athlete not found'
        });
      }

      // Set both req.athlete AND req.user for compatibility
      req.athlete = athlete;
      req.user = {
        id: athlete._id.toString(),
        _id: athlete._id,
        name: athlete.name,
        email: athlete.email,
        role: athlete.role
      };

      console.log('✅ Authentication successful for:', athlete.email);
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - Invalid token'
      });
    }
  } catch (error) {
    console.error('Protect middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Require athlete role
const requireAthlete = (req, res, next) => {
  if (req.athlete && req.athlete.role === 'athlete') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Athlete role required to access this resource'
    });
  }
};

module.exports = {
  protect,
  requireAthlete
};