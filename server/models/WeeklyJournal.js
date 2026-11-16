
const mongoose = require('mongoose');

const weeklyJournalSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },

    weekNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 53
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: 'End date cannot be earlier than start date.'
      }
    },

    activities: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },

    learnings: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },

    challenges: {
      type: String,
      default: '',
      trim: true,
      maxlength: 5000
    },

    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Approved', 'Rejected'],
      default: 'Draft'
    },

    feedback: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate weekly journals for the same student
weeklyJournalSchema.index(
  { student: 1, weekNumber: 1 },
  {
    unique: true,
    name: 'unique_student_week'
  }
);

module.exports = mongoose.model('WeeklyJournal', weeklyJournalSchema);
