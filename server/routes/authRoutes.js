
const express = require('express');
const router = express.Router();

const {
  register,
  login
} = require('../controllers/authController');

const {
  protect
} = require('../middleware/authMiddleware');

// Student registration
router.post('/register', register);

// User login
router.post('/login', login);

// Get currently logged-in user
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      student: req.user.student,
      company: req.user.company,
      companyId: req.user.companyId,
      department: req.user.department,
      avatar: req.user.avatar
    }
  });
});

module.exports = router;
