
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');

// Verify whether the user is logged in
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // No token provided
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please log in.'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and exclude password
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.'
      });
    }

    // Check Student account status
    if (user.role === 'student') {
      const student = await Student.findById(user.student);

      if (!student) {
        return res.status(403).json({
          success: false,
          message: 'Student profile not found. Please contact the OJT Coordinator.'
        });
      }

      if (student.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Your student account is inactive. Please contact the OJT Coordinator.'
        });
      }
    }

    // Attach authenticated user to request
    req.user = user;

    next();

  } catch (error) {
    console.error('Authentication error:', error.message);

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

// Check user role permissions
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.'
      });
    }

    next();
  };
};
