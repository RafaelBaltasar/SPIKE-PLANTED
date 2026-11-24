
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
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

    password: {
      type: String,
      required: true,
      minlength: 8
    },

    role: {
      type: String,
      enum: ['student', 'coordinator', 'admin', 'staff'],
      required: true
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null
    },

    // Existing company name field retained for compatibility.
    company: {
      type: String,
      default: null
    },

    // Links a company supervisor to an actual Company record.
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null
    },

    department: {
      type: String,
      default: null
    },

    avatar: {
      type: String,
      default: ''
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);
});

// Compare entered password with hashed password.
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
