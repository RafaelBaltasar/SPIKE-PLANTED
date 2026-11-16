const User = require('../models/User');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// REGISTER
exports.register = async (req, res) => {
  try {
    const { email, password, role, fullName, studentNumber, firstName, lastName, program, yearLevel, department } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Determine approval status (Students are Active, Faculty/Admin are Pending)
    const isPending = role === 'coordinator' || role === 'admin';

    let studentId = null;

    // If student, create Student profile first
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
      isActive: !isPending // If pending, they are inactive until approved
    });

    // If pending, do NOT send a token. Tell frontend to wait.
    if (isPending) {
      return res.status(201).json({
        success: true,
        requiresApproval: true,
        message: 'Account created! Please wait for the current Admin to approve your account before logging in.'
      });
    }

    // If student, send token immediately
    const token = generateToken(user._id);
    res.status(201).json({
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
    res.status(500).json({ success: false, message: 'Failed to register account.' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval.' });
    }

    const token = generateToken(user._id);
    res.status(200).json({
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
    res.status(500).json({ success: false, message: 'Failed to login.' });
  }
};