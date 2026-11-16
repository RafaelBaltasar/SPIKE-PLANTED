const mongoose = require('mongoose');
const Student = require('../models/Student');
const OjtRecord = require('../models/OjtRecord');
const WeeklyJournal = require('../models/WeeklyJournal');
const Document = require('../models/Document');

// ─────────────────────────────────────────────────────────────
// COORDINATOR: LIST ALL STUDENTS
// ─────────────────────────────────────────────────────────────
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ lastName: 1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      students
    });

  } catch (error) {
    console.error('Get all students error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve students.'
    });
  }
};

// ─────────────────────────────────────────────────────────────
// COORDINATOR: GET A STUDENT'S FULL RECORD
// (attendance + journals + documents + summary)
// ─────────────────────────────────────────────────────────────
exports.getStudentRecord = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID.'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    const [attendance, journals, documents] = await Promise.all([
      OjtRecord.find({ student: studentId }).sort({ date: -1 }),
      WeeklyJournal.find({ student: studentId }).sort({ weekNumber: 1 }),
      Document.find({ student: studentId }).sort({ createdAt: -1 })
    ]);

    // Attendance summary
    const completedRecords = attendance.filter(r => r.timeOut != null);
    const totalHours = completedRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);

    // Journal summary
    const journalSummary = {
      total: journals.length,
      approved: journals.filter(j => j.status === 'Approved').length,
      submitted: journals.filter(j => j.status === 'Submitted').length,
      draft: journals.filter(j => j.status === 'Draft').length,
      rejected: journals.filter(j => j.status === 'Rejected').length
    };

    // Document summary
    const docSummary = {
      total: documents.length,
      approved: documents.filter(d => d.status === 'Approved').length,
      pending: documents.filter(d => d.status === 'Pending').length,
      rejected: documents.filter(d => d.status === 'Rejected').length
    };

    return res.status(200).json({
      success: true,
      student,
      summary: {
        attendance: {
          totalDays: attendance.length,
          completedDays: completedRecords.length,
          totalHours: Number(totalHours.toFixed(2))
        },
        journals: journalSummary,
        documents: docSummary
      },
      attendance,
      journals,
      documents
    });

  } catch (error) {
    console.error('Get student record error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student record.'
    });
  }
};

// ─────────────────────────────────────────────────────────────
// COORDINATOR: APPROVE / REJECT A JOURNAL
// (use this from the student record page)
// ─────────────────────────────────────────────────────────────
exports.reviewJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid journal ID.'
      });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "Approved" or "Rejected".'
      });
    }

    const journal = await WeeklyJournal.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          feedback: (feedback || '').trim(),
          reviewedBy: req.user._id,
          reviewedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).populate('student', 'studentNumber firstName lastName program');

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Journal ${status.toLowerCase()} successfully!`,
      journal
    });

  } catch (error) {
    console.error('Review journal error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to review journal.'
    });
  }
};

// ─────────────────────────────────────────────────────────────
// COORDINATOR: APPROVE / REJECT AN ATTENDANCE RECORD
// ─────────────────────────────────────────────────────────────
exports.reviewAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance record ID.'
      });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "Approved" or "Rejected".'
      });
    }

    const record = await OjtRecord.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          remarks: (remarks || '').trim(),
          reviewedBy: req.user._id
        }
      },
      { new: true, runValidators: true }
    ).populate('student', 'studentNumber firstName lastName program');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Attendance record ${status.toLowerCase()} successfully!`,
      attendance: record
    });

  } catch (error) {
    console.error('Review attendance error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to review attendance.'
    });
  }
};