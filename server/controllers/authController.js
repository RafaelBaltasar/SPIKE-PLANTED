
const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
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
      department,
      company
    } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password || !role || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required account information.'
      });
    }

    if (!['student', 'coordinator', 'admin', 'staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account role.'
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    const isPending = ['coordinator', 'admin', 'staff'].includes(role);

    let studentId = null;
    let companyRecord = null;

    // Create student profile.
    if (role === 'student') {
      if (
        !studentNumber ||
        !firstName ||
        !lastName ||
        !program ||
        !yearLevel
      ) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required student information.'
        });
      }

      const existingStudent = await Student.findOne({
        $or: [
          { email: normalizedEmail },
          { studentNumber: studentNumber.trim() }
        ]
      });

      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Student email or student number already exists.'
        });
      }

      const newStudent = await Student.create({
        studentNumber: studentNumber.trim(),
        firstName,
        lastName,
        email: normalizedEmail,
        program,
        yearLevel,
        status: 'Active'
      });

      studentId = newStudent._id;
    }

    // Create or reuse the company record for a supervisor.
    if (role === 'staff') {
      if (!company?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Please provide your company name.'
        });
      }

      companyRecord = await Company.findOne({
        email: normalizedEmail
      });

      if (companyRecord?.status === 'Rejected') {
        companyRecord.name = company.trim();
        companyRecord.contactPerson = fullName;
        companyRecord.status = 'Pending';
        await companyRecord.save();
      } else if (!companyRecord) {
        companyRecord = await Company.create({
          name: company.trim(),
          contactPerson: fullName,
          email: normalizedEmail,
          status: 'Pending'
        });
      }
    }

    // Create user account.
    const user = await User.create({
      fullName,
      email: normalizedEmail,
      password,
      role,
      student: studentId,
      company: company?.trim() || null,
      companyId: companyRecord?._id || null,
      department: department || null,
      isActive: !isPending
    });

    // Staff, coordinator, and admin accounts require approval.
    if (isPending) {
      return res.status(201).json({
        success: true,
        requiresApproval: true,
        message:
          role === 'staff'
            ? 'Company registration submitted! Please wait for Admin approval.'
            : 'Account created! Please wait for the Admin to approve your account before logging in.'
      });
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        student: user.student,
        company: user.company,
        companyId: user.companyId
      }
    });
  } catch (error) {
    console.error('Register error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This email, student number, or company is already registered.'
      });
    }

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
    const normalizedEmail = email?.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

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

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval.'
      });
    }

    // Verify and synchronize company information for supervisors.
    if (user.role === 'staff') {
      const companyRecord = await Company.findOne({
        email: user.email,
        status: 'Approved'
      });

      if (!companyRecord) {
        return res.status(403).json({
          success: false,
          message: 'Your company has not been approved. Please contact the Admin.'
        });
      }

      // Supports supervisor accounts created before companyId was added.
      if (
        !user.companyId ||
        user.companyId.toString() !== companyRecord._id.toString() ||
        user.company !== companyRecord.name
      ) {
        user.companyId = companyRecord._id;
        user.company = companyRecord.name;
        await user.save();
      }
    }

    // Verify student profile and status.
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

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        student: user.student,
        company: user.company,
        companyId: user.companyId,
        department: user.department,
        avatar: user.avatar
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
