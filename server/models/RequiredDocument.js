
const mongoose = require('mongoose');

const requiredDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },

    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500
    },

    dueDate: {
      type: Date,
      default: null
    },

    // Each requirement belongs to a specific company.
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'RequiredDocument',
  requiredDocumentSchema
);
