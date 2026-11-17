
const User = require('../models/User');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// REGISTER
exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      fullName,
      studentNumber,
      firstName,
      lastName,
      program,
      yearLevel,
      department
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    // Determine approval status
    const isPending = role === 'coordinator' || role === 'admin';

    let studentId = null;

    // Create Student profile
    if (role === 'student') {
      const newStudent = await Student.create({
        studentNumber,
        firstName,
        lastName,
        email,
        program,
        yearLevel,
        status: 'Active'
      });

      studentId = newStudent._id;
    }

    // Create User account
    user = await User.create({
      fullName,
      email,
      password,
      role,
      student: studentId,
      department: department || null,
      isActive: !isPending
    });

    // Pending coordinator/admin accounts
    if (isPending) {
      return res.status(201).json({
        success: true,
        requiresApproval: true,
        message: 'Account created! Please wait for the current Admin to approve your account before logging in.'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        student: user.student
      }
    });

  } catch (error) {
    console.error('Register error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to register account.'
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check account activation
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval.'
      });
    }

    // Check Student profile status
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

    // Generate token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        student: user.student
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to login.'
    });
  }
};
