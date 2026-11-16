
const User = require('../models/User');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// STUDENT REGISTRATION
exports.register = async (req, res) => {
  let student = null;
  let user = null;

  try {
    const {
      fullName,
      email,
      password,
      studentNumber,
      firstName,
      lastName,
      program,
      yearLevel,
      section,
      contactNumber
    } = req.body || {};

    // Validate required fields and input types
    const requiredFields = {
      fullName,
      email,
      password,
      studentNumber,
      firstName,
      lastName,
      program,
      yearLevel
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (typeof value !== 'string' || !value.trim()) {
        return res.status(400).json({
          success: false,
          message: `Please provide a valid ${field}.`
        });
      }
    }

    // Normalize input
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedStudentNumber = studentNumber.trim();

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // Validate password
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters.'
      });
    }

    // Validate field lengths
    if (
      fullName.trim().length > 120 ||
      normalizedEmail.length > 254 ||
      normalizedStudentNumber.length > 50 ||
      firstName.trim().length > 60 ||
      lastName.trim().length > 60 ||
      program.trim().length > 100 ||
      yearLevel.trim().length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: 'One or more fields exceed the allowed length.'
      });
    }

    // Validate optional fields
    if (
      section !== undefined &&
      typeof section !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Section must be valid text.'
      });
    }

    if (
      contactNumber !== undefined &&
      typeof contactNumber !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Contact number must be valid text.'
      });
    }

    if (
      (section || '').trim().length > 50 ||
      (contactNumber || '').trim().length > 30
    ) {
      return res.status(400).json({
        success: false,
        message: 'Section or contact number exceeds the allowed length.'
      });
    }

    // Check existing user email
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered.'
      });
    }

    // Check existing student email or student number
    const existingStudent = await Student.findOne({
      $or: [
        { email: normalizedEmail },
        { studentNumber: normalizedStudentNumber }
      ]
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Student email or student number already exists.'
      });
    }

    // Create student profile
    student = await Student.create({
      studentNumber: normalizedStudentNumber,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      program: program.trim(),
      yearLevel: yearLevel.trim(),
      section: (section || '').trim(),
      contactNumber: (contactNumber || '').trim()
    });

    // Create student account
    // Public registration always creates student accounts.
    // Never accept a role supplied by the client.
    user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      role: 'student',
      student: student._id
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully!',
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
    // Clean up records created by this registration attempt
    try {
      if (user) {
        await User.findByIdAndDelete(user._id);
      }

      if (student) {
        await Student.findByIdAndDelete(student._id);
      }
    } catch (cleanupError) {
      console.error('Registration cleanup error:', cleanupError.message);
    }

    // Handle duplicate database indexes
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email or student number is already registered.'
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Please check your registration information.',
        errors: Object.values(error.errors).map(
          (item) => item.message
        )
      });
    }

    console.error('Registration error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// USER LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated.'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
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
    console.error('Login error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};
