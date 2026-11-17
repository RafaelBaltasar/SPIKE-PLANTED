
const mongoose = require('mongoose');

const User = require('../models/User');
const Student = require('../models/Student');
const OjtRecord = require('../models/OjtRecord');
const WeeklyJournal = require('../models/WeeklyJournal');
const Document = require('../models/Document');

// ============================================
// ADMIN: GET DASHBOARD SUMMARY
// ============================================
exports.getDashboardSummary = async (req, res) => {
  try {
    const [
      totalStudents,
      activeStudents,
      inactiveStudents,
      totalUsers,
      pendingAccounts,
      pendingJournals,
      pendingAttendance,
      pendingDocuments,
      approvedHours
    ] = await Promise.all([
      Student.countDocuments(),

      Student.countDocuments({ status: 'Active' }),

      Student.countDocuments({ status: 'Inactive' }),

      User.countDocuments(),

      User.find({
        isActive: false,
        role: { $in: ['coordinator', 'admin'] }
      })
        .select('fullName email role createdAt')
        .sort({ createdAt: -1 }),

      WeeklyJournal.countDocuments({
        status: 'Submitted'
      }),

      OjtRecord.countDocuments({
        status: 'Pending',
        timeOut: { $ne: null }
      }),

      Document.countDocuments({
        status: 'Pending'
      }),

      OjtRecord.aggregate([
        {
          $match: {
            status: 'Approved',
            timeOut: { $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            totalHours: { $sum: '$totalHours' }
          }
        }
      ])
    ]);

    const totalOjtHours = approvedHours[0]?.totalHours || 0;

    return res.status(200).json({
      success: true,

      summary: {
        totalStudents,
        activeStudents,
        inactiveStudents,
        totalUsers,
        totalOjtHours: Number(totalOjtHours.toFixed(2)),
        pendingAccounts: pendingAccounts.length,
        pendingJournals,
        pendingAttendance,
        pendingDocuments,
        pendingApprovals:
          pendingJournals + pendingAttendance + pendingDocuments
      },

      pendingAccounts
    });

  } catch (error) {
    console.error('Admin dashboard error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin dashboard.'
    });
  }
};

// ============================================
// ADMIN: APPROVE USER ACCOUNT
// ============================================
exports.approveUserAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.'
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        isActive: false,
        role: { $in: ['coordinator', 'admin'] }
      },
      {
        $set: { isActive: true }
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pending account not found or already approved.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User account approved successfully.',
      user
    });

  } catch (error) {
    console.error('Approve user error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to approve user account.'
    });
  }
};

// ============================================
// ADMIN: GET SYSTEM REPORTS
// ============================================
exports.getSystemReports = async (req, res) => {
  try {
    const [
      students,
      approvedHours
    ] = await Promise.all([
      Student.find()
        .select(
          'firstName lastName studentNumber email program status'
        )
        .sort({ lastName: 1 }),

      OjtRecord.aggregate([
        {
          $match: {
            status: 'Approved',
            timeOut: { $ne: null }
          }
        },
        {
          $group: {
            _id: '$student',
            totalHours: {
              $sum: '$totalHours'
            }
          }
        }
      ])
    ]);

    // Map approved hours to each student.
    const hoursMap = new Map(
      approvedHours.map(record => [
        String(record._id),
        Number(record.totalHours || 0)
      ])
    );

    const requiredHours = 486;

    const studentReports = students.map(student => {
      const totalHours = Number(
        (hoursMap.get(String(student._id)) || 0).toFixed(2)
      );

      const progress = Math.min(
        (totalHours / requiredHours) * 100,
        100
      );

      return {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentNumber: student.studentNumber,
        email: student.email,
        program: student.program,
        status: student.status,
        totalHours,
        progress: Number(progress.toFixed(2)),
        completed: totalHours >= requiredHours
      };
    });

    // Calculate system statistics.
    const totalStudents = studentReports.length;

    const activeStudents = studentReports.filter(
      student => student.status === 'Active'
    ).length;

    const inactiveStudents = studentReports.filter(
      student => student.status === 'Inactive'
    ).length;

    const completedStudents = studentReports.filter(
      student => student.completed
    ).length;

    const totalOjtHours = Number(
      studentReports.reduce(
        (total, student) => total + student.totalHours,
        0
      ).toFixed(2)
    );

    return res.status(200).json({
      success: true,

      summary: {
        totalStudents,
        activeStudents,
        inactiveStudents,
        completedStudents,
        totalOjtHours,
        requiredHours
      },

      students: studentReports
    });

  } catch (error) {
    console.error('System reports error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to generate system reports.'
    });
  }
};
