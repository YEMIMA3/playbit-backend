const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.coach = { _id: decoded.id }; // 🔸 crucial for protectCoach
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
};

module.exports = { verifyToken };
