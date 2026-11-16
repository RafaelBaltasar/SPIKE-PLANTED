
const mongoose = require('mongoose');

const ojtRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },

    // Philippine calendar date: YYYY-MM-DD
    attendanceDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },

    // Actual attendance timestamp
    date: {
      type: Date,
      required: true
    },

    timeIn: {
      type: Date,
      required: true
    },

    timeOut: {
      type: Date,
      default: null
    },

    totalHours: {
      type: Number,
      default: 0,
      min: 0
    },

    remarks: {
      type: String,
      default: ''
    },

    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent multiple attendance records for one student
// on the same Philippine calendar date.
ojtRecordSchema.index(
  { student: 1, attendanceDate: 1 },
  { unique: true, name: 'unique_student_attendance_date' }
);

module.exports = mongoose.model('OjtRecord', ojtRecordSchema);
