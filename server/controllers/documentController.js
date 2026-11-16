const mongoose = require('mongoose');
const Document = require('../models/Document');

// ─────────────────────────────────────────────────────────────
// STUDENT: UPLOAD A DOCUMENT
// ─────────────────────────────────────────────────────────────
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.user.student) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not linked to a student profile.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.'
      });
    }

    const { documentType } = req.body;

    const allowedTypes = [
      'MOA',
      'Insurance',
      'Endorsement Letter',
      'Medical Certificate',
      'Other'
    ];

    if (!documentType || !allowedTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: `documentType must be one of: ${allowedTypes.join(', ')}`
      });
    }

    // Optional: prevent duplicate upload of the same document type
    // (uncomment if you want one doc per type per student)
    // const existing = await Document.findOne({
    //   student: req.user.student,
    //   documentType
    // });
    // if (existing) {
    //   return res.status(409).json({
    //     success: false,
    //     message: `You have already uploaded a ${documentType}.`
    //   });
    // }

    const doc = await Document.create({
      student: req.user.student,
      documentType,
      fileName: req.file.originalname,
      filePath: `/uploads/documents/${req.file.filename}`,
      status: 'Pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully!',
      document: doc
    });

  } catch (error) {
    console.error('Upload document error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to upload document.'
    });
  }
};

// ─────────────────────────────────────────────────────────────
// STUDENT: GET MY DOCUMENTS
// ─────────────────────────────────────────────────────────────
exports.getMyDocuments = async (req, res) => {
  try {
    if (!req.user.student) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not linked to a student profile.'
      });
    }

    const documents = await Document.find({
      student: req.user.student
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });

  } catch (error) {
    console.error('Get documents error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents.'
    });
  }
};

// ─────────────────────────────────────────────────────────────
// COORDINATOR: VIEW ALL DOCUMENTS (with student info)
// ─────────────────────────────────────────────────────────────
exports.getAllDocuments = async (req, res) => {
  try {
    const { status, documentType } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (documentType) filter.documentType = documentType;

    const documents = await Document.find(filter)
      .populate('student', 'studentNumber firstName lastName program')
      .populate('reviewedBy', 'fullName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });

  } catch (error) {
    console.error('Get all documents error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents.'
    });
  }
};

// ─────────────────────────────────────────────────────────────
// COORDINATOR: VERIFY / REJECT A DOCUMENT
// ─────────────────────────────────────────────────────────────
exports.reviewDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID.'
      });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "Approved" or "Rejected".'
      });
    }

    if (status === 'Rejected' && (!remarks || !remarks.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Remarks are required when rejecting a document.'
      });
    }

    const doc = await Document.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          remarks: (remarks || '').trim(),
          reviewedBy: req.user._id,
          reviewedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).populate('student', 'studentNumber firstName lastName program');

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Document ${status.toLowerCase()} successfully!`,
      document: doc
    });

  } catch (error) {
    console.error('Review document error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to review document.'
    });
  }
};