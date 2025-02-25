const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        status: 'error',
        message: 'Please login to access this route'
      });
    }

    try {
      // Verify token and get decoded data
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if userId exists in decoded token
      if (!decoded.userId) {
        console.log('Invalid token structure');
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token format'
        });
      }

      // Get user from database using decoded userId
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        console.log(`User not found with id: ${decoded.userId}`);
        return res.status(401).json({
          status: 'error',
          message: 'User no longer exists'
        });
      }

      // Attach user to request object
      req.user = user;
      next();
      
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.message);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication'
    });
  }
};

module.exports = { protect };