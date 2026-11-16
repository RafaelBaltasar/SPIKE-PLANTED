
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    firstName: {
      type: String,
      required: true,
      trim: true
    },

    lastName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    program: {
      type: String,
      required: true
    },

    yearLevel: {
      type: String,
      required: true
    },

    section: {
      type: String,
      default: ''
    },

    contactNumber: {
      type: String,
      default: ''
    },

    status: {
      type: String,
      enum: ['Pending', 'Active', 'Completed', 'Inactive'],
      default: 'Pending'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Student', studentSchema);
