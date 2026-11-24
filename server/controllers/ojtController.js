
const mongoose = require('mongoose');
const OjtRecord = require('../models/OjtRecord');
const Student = require('../models/Student');

// =============================================
// GET TODAY'S DATE IN PHILIPPINE TIME
// =============================================
const getPhilippineDate = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const values = {};

  parts.forEach(({ type, value }) => {
    values[type] = value;
  });

  return `${values.year}-${values.month}-${values.day}`;
};


// =============================================
// STUDENT: GET MY ATTENDANCE HISTORY
// =============================================
exports.getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user.student;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not linked to a student profile.'
      });
    }

    const records = await OjtRecord.find({
      student: studentId
    }).sort({ date: -1 });

    const completedRecords = records.filter(
      record => record.timeOut != null
    );

    // Only coordinator-approved attendance counts toward OJT hours.
    const approvedRecords = completedRecords.filter(
      record => record.status === 'Approved'
    );

    const totalHours = approvedRecords.reduce(
      (sum, record) => sum + (record.totalHours || 0),
      0
    );

    return res.status(200).json({
      success: true,
      count: records.length,
      summary: {
        totalDays: records.length,
        completedDays: completedRecords.length,
        approvedDays: approvedRecords.length,
        totalHours: Number(totalHours.toFixed(2))
      },
      attendance: records
    });

  } catch (error) {
    console.error('Get attendance error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance records.'
    });
  }
};


// =============================================
// STUDENT: TIME-IN
// =============================================
exports.timeIn = async (req, res) => {
  try {
    const studentId = req.user.student;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not linked to a student profile.'
      });
    }

    const attendanceDate = getPhilippineDate();

    // Prevent another time-in while an earlier record is unfinished.
    const unfinishedRecord = await OjtRecord.findOne({
      student: studentId,
      timeOut: null
    }).sort({ timeIn: 1 });

    if (unfinishedRecord) {
      if (unfinishedRecord.attendanceDate === attendanceDate) {
        return res.status(409).json({
          success: false,
          message: 'You have already timed in today.'
        });
      }

      return res.status(409).json({
        success: false,
        message: 'You have an unfinished attendance record from a previous day. Please contact your OJT coordinator.'
      });
    }

    const now = new Date();

    const record = await OjtRecord.create({
      student: studentId,
      date: now,
      attendanceDate,
      timeIn: now,
      timeOut: null,
      totalHours: 0,
      status: 'Pending',
      supervisorStatus: 'Pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Time-in recorded successfully!',
      attendance: record
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You already have an attendance record for today.'
      });
    }

    console.error('Time-in error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to record time-in.'
    });
  }
};


// =============================================
// STUDENT: TIME-OUT
// =============================================
exports.timeOut = async (req, res) => {
  try {
    const studentId = req.user.student;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not linked to a student profile.'
      });
    }

    // Find the student's unfinished record.
    const record = await OjtRecord.findOne({
      student: studentId,
      timeOut: null
    }).sort({ timeIn: 1 });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'No active time-in record found.'
      });
    }

    const now = new Date();

    if (now <= record.timeIn) {
      return res.status(400).json({
        success: false,
        message: 'Time-out must be later than time-in.'
      });
    }

    const elapsedMilliseconds = now - record.timeIn;
    const totalHours = elapsedMilliseconds / (1000 * 60 * 60);

    // Atomically update only if the record is still unfinished.
    const updatedRecord = await OjtRecord.findOneAndUpdate(
      {
        _id: record._id,
        student: studentId,
        timeOut: null
      },
      {
        $set: {
          timeOut: now,
          totalHours: Number(totalHours.toFixed(2))
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedRecord) {
      return res.status(409).json({
        success: false,
        message: 'This attendance record has already been timed out.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Time-out recorded successfully!',
      attendance: updatedRecord
    });

  } catch (error) {
    console.error('Time-out error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to record time-out.'
    });
  }
};


// =============================================
// SUPERVISOR: GET PENDING COMPANY ATTENDANCE
// =============================================
exports.getCompanyPendingAttendance = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (
      !companyId ||
      !mongoose.Types.ObjectId.isValid(companyId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Your supervisor account is not linked to a valid company.'
      });
    }

    // Only retrieve students assigned to this supervisor's company.
    const students = await Student.find({
      companyId
    }).select('_id');

    const studentIds = students.map(student => student._id);

    const attendance = await OjtRecord.find({
      student: { $in: studentIds },
      timeOut: { $ne: null },
      supervisorStatus: { $in: ['Pending', null] }
    })
      .populate(
        'student',
        'studentNumber firstName lastName email program yearLevel section'
      )
      .sort({ attendanceDate: -1, timeIn: -1 });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      attendance
    });

  } catch (error) {
    console.error('Get company attendance error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending attendance.'
    });
  }
};


// =============================================
// SUPERVISOR: REVIEW COMPANY ATTENDANCE
// =============================================
exports.reviewAttendanceBySupervisor = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body || {};
    const companyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID.'
      });
    }

    if (
      !companyId ||
      !mongoose.Types.ObjectId.isValid(companyId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Your supervisor account is not linked to a valid company.'
      });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Review status must be Approved or Rejected.'
      });
    }

    if (
      remarks !== undefined &&
      (
        typeof remarks !== 'string' ||
        remarks.trim().length > 2000
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Remarks must be valid text and not exceed 2000 characters.'
      });
    }

    if (status === 'Rejected' && !(remarks || '').trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide remarks when rejecting attendance.'
      });
    }

    // Find the attendance record.
    const record = await OjtRecord.findById(id);

    if (!record || !record.timeOut) {
      return res.status(404).json({
        success: false,
        message: 'Completed attendance record not found.'
      });
    }

    // Verify that this student belongs to the supervisor's company.
    const assignedStudent = await Student.findOne({
      _id: record.student,
      companyId
    });

    if (!assignedStudent) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to review this attendance record.'
      });
    }

    // Atomically review only records that have not been reviewed.
    // Also supports older records with no supervisorStatus field.
    const updatedRecord = await OjtRecord.findOneAndUpdate(
      {
        _id: id,
        student: assignedStudent._id,
        timeOut: { $ne: null },
        supervisorStatus: { $in: ['Pending', null] }
      },
      {
        $set: {
          supervisorStatus: status,
          supervisorReviewedBy: req.user._id,
          supervisorReviewedAt: new Date(),
          supervisorRemarks: (remarks || '').trim()
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate(
      'student',
      'studentNumber firstName lastName email program yearLevel section'
    );

    if (!updatedRecord) {
      return res.status(409).json({
        success: false,
        message: 'This attendance record has already been reviewed by a supervisor.'
      });
    }

    return res.status(200).json({
      success: true,
      message: status === 'Approved'
        ? 'Attendance approved by supervisor and forwarded to the coordinator.'
        : 'Attendance rejected by supervisor.',
      attendance: updatedRecord
    });

  } catch (error) {
    console.error('Supervisor attendance review error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to review attendance.'
    });
  }
};
