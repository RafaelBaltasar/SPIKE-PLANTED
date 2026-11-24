
const mongoose = require('mongoose');

const Document = require('../models/Document');
const RequiredDocument = require('../models/RequiredDocument');
const Student = require('../models/Student');
const Company = require('../models/Company');

const DEFAULT_REQUIREMENTS = [
  'MOA',
  'Insurance',
  'Endorsement Letter',
  'Medical Certificate',
  'Other'
];

// Find the student profile connected to a user account.
const findStudentRecord = async (user) => {
  if (!user) return null;

  if (user.student) {
    const student = await Student.findById(user.student);
    if (student) return student;
  }

  if (user.email) {
    return Student.findOne({
      email: user.email.toLowerCase()
    });
  }

  return null;
};

// Convert default requirements into frontend-compatible objects.
const createDefaultRequirements = (companyId = null) =>
  DEFAULT_REQUIREMENTS.map((title) => ({
    _id: `default-${title}`,
    title,
    description: '',
    dueDate: null,
    companyId,
    isActive: true,
    isDefault: true,
    passedBy: []
  }));

// Add approved submissions to each requirement.
// Only submissions from students belonging to the requirement's company
// are included.
const attachApprovedSubmissions = async (requirements) => {
  if (!requirements.length) return [];

  const approvedDocuments = await Document.find({
    status: 'Approved'
  })
    .populate(
      'student',
      'studentNumber firstName lastName companyId'
    )
    .sort({ createdAt: -1 });

  return requirements.map((requirement) => {
    const requirementObject = requirement.toObject
      ? requirement.toObject()
      : { ...requirement };

    const requirementCompanyId = requirementObject.companyId
      ? String(
          requirementObject.companyId._id ||
          requirementObject.companyId
        )
      : null;

    const passedBy = approvedDocuments
      .filter((doc) => {
        if (!doc.student) return false;
        if (doc.documentType !== requirementObject.title) return false;
        if (!requirementCompanyId) return false;

        return (
          String(doc.student.companyId) === requirementCompanyId
        );
      })
      .map((doc) => ({
        _id: doc._id,
        studentName: `${doc.student.firstName} ${doc.student.lastName}`,
        studentNumber: doc.student.studentNumber,
        fileName: doc.fileName,
        filePath: doc.filePath
      }));

    return {
      ...requirementObject,
      passedBy
    };
  });
};

// ============================================================
// STAFF / COORDINATOR / ADMIN: GET MANAGED REQUIREMENTS
// ============================================================

exports.getRequiredDocuments = async (req, res) => {
  try {
    const isStaff = req.user.role === 'staff';
    const filter = {};

    if (isStaff) {
      if (!req.user.companyId) {
        return res.status(400).json({
          success: false,
          message: 'Your staff account is not assigned to a company.'
        });
      }

      filter.companyId = req.user.companyId;
    }

    const customRequirements = await RequiredDocument.find(filter)
      .populate('companyId', 'name')
      .sort({ createdAt: -1 });

    let requirements = customRequirements;

    // Always show the five standard requirements to staff.
    // Custom requirements are displayed alongside them.
    if (isStaff) {
      const defaultRequirements = createDefaultRequirements(
        req.user.companyId
      );

      requirements = [
        ...defaultRequirements,
        ...customRequirements
      ];
    }

    const enrichedRequirements =
      await attachApprovedSubmissions(requirements);

    return res.status(200).json({
      success: true,
      count: enrichedRequirements.length,
      requirements: enrichedRequirements
    });
  } catch (error) {
    console.error('Get required documents error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve required documents.'
    });
  }
};

// ============================================================
// STAFF / COORDINATOR / ADMIN: CREATE A REQUIREMENT
// ============================================================

exports.createRequiredDocument = async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Requirement title is required.'
      });
    }

    const trimmedTitle = title.trim();

    if (trimmedTitle.length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Requirement title cannot exceed 120 characters.'
      });
    }

    if (
      description &&
      description.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 500 characters.'
      });
    }

    // Prevent duplicate custom requirements matching standard types.
    if (
      DEFAULT_REQUIREMENTS.some(
        (item) => item.toLowerCase() === trimmedTitle.toLowerCase()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'This is already a standard OJT requirement.'
      });
    }

    let companyId;

    if (req.user.role === 'staff') {
      // Staff can only post requirements for their own company.
      companyId = req.user.companyId;
    } else {
      // Coordinator/admin must specify the target company.
      companyId = req.body.companyId || req.user.companyId;
    }

    if (
      !companyId ||
      !mongoose.Types.ObjectId.isValid(companyId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'A valid company assignment is required.'
      });
    }

    const companyExists = await Company.exists({
      _id: companyId,
      status: 'Approved'
    });

    if (!companyExists) {
      return res.status(400).json({
        success: false,
        message: 'The target company must be an approved company.'
      });
    }

    let parsedDueDate = null;

    if (dueDate) {
      parsedDueDate = new Date(dueDate);

      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid due date.'
        });
      }
    }

    const requirement = await RequiredDocument.create({
      title: trimmedTitle,
      description: (description || '').trim(),
      dueDate: parsedDueDate,
      companyId,
      createdBy: req.user._id,
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Required document posted successfully.',
      requirement
    });
  } catch (error) {
    console.error('Create requirement error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create required document.'
    });
  }
};

// ============================================================
// STAFF / COORDINATOR / ADMIN: ACTIVATE OR HIDE REQUIREMENT
// ============================================================

exports.toggleRequiredDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid requirement ID.'
      });
    }

    const requirement = await RequiredDocument.findById(id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found.'
      });
    }

    // Standard default requirements cannot be toggled.
    // They are virtual frontend objects, not database records.

    // Staff cannot modify another company's requirements.
    if (
      req.user.role === 'staff' &&
      (
        !req.user.companyId ||
        String(requirement.companyId) !== String(req.user.companyId)
      )
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this requirement.'
      });
    }

    requirement.isActive = !requirement.isActive;
    await requirement.save();

    return res.status(200).json({
      success: true,
      message: `Requirement ${
        requirement.isActive ? 'activated' : 'hidden'
      } successfully.`,
      requirement
    });
  } catch (error) {
    console.error('Toggle requirement error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update requirement status.'
    });
  }
};

// ============================================================
// STUDENT: GET ACTIVE REQUIREMENTS FOR ASSIGNED COMPANY
// ============================================================

exports.getActiveRequirements = async (req, res) => {
  try {
    const student = await findStudentRecord(req.user);

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not linked to a student profile.'
      });
    }

    if (!student.companyId) {
      return res.status(200).json({
        success: true,
        count: 0,
        requirements: []
      });
    }

    const companyFilter = {
      companyId: student.companyId
    };

    // Always include all five standard requirements.
    const defaultRequirements = createDefaultRequirements(
      student.companyId
    );

    // Add only active custom requirements belonging to this company.
    const customRequirements = await RequiredDocument.find({
      ...companyFilter,
      isActive: true
    })
      .sort({ createdAt: -1 });

    const requirements = [
      ...defaultRequirements,
      ...customRequirements
    ];

    return res.status(200).json({
      success: true,
      count: requirements.length,
      requirements
    });
  } catch (error) {
    console.error('Get active requirements error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve active requirements.'
    });
  }
};

// ============================================================
// STUDENT: UPLOAD A DOCUMENT
// ============================================================

exports.uploadDocument = async (req, res) => {
  try {
    const student = await findStudentRecord(req.user);

    if (!student) {
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

    const documentType = (req.body.documentType || '').trim();

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: 'Please select a document requirement.'
      });
    }

    if (!student.companyId) {
      return res.status(400).json({
        success: false,
        message: 'You must be assigned to a company before uploading requirements.'
      });
    }

    // Standard requirements are always available.
    const isDefaultRequirement =
      DEFAULT_REQUIREMENTS.includes(documentType);

    // Custom requirements must be active and belong to
    // the student's assigned company.
    const customRequirement = isDefaultRequirement
      ? null
      : await RequiredDocument.findOne({
          companyId: student.companyId,
          title: documentType,
          isActive: true
        });

    if (!isDefaultRequirement && !customRequirement) {
      return res.status(400).json({
        success: false,
        message: 'This requirement is not active or does not belong to your assigned company.'
      });
    }

    const doc = await Document.create({
      student: student._id,
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
    console.error('Upload document error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to upload document.'
    });
  }
};

// ============================================================
// STUDENT: GET MY DOCUMENTS
// ============================================================

exports.getMyDocuments = async (req, res) => {
  try {
    const student = await findStudentRecord(req.user);

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not linked to a student profile.'
      });
    }

    const documents = await Document.find({
      student: student._id
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Get documents error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents.'
    });
  }
};

// ============================================================
// COORDINATOR / ADMIN: VIEW ALL DOCUMENTS
// ============================================================

exports.getAllDocuments = async (req, res) => {
  try {
    const { status, documentType } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (documentType) filter.documentType = documentType;

    const documents = await Document.find(filter)
      .populate(
        'student',
        'studentNumber firstName lastName program companyId'
      )
      .populate('reviewedBy', 'fullName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Get all documents error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents.'
    });
  }
};

// ============================================================
// COORDINATOR / ADMIN: APPROVE OR REJECT A DOCUMENT
// ============================================================

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

    const doc = await Document.findOneAndUpdate(
      { _id: id, status: 'Pending' },
      {
        $set: {
          status,
          remarks: (remarks || '').trim(),
          reviewedBy: req.user._id,
          reviewedAt: new Date()
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).populate(
      'student',
      'studentNumber firstName lastName program'
    );

    if (!doc) {
      const exists = await Document.exists({ _id: id });

      return res.status(exists ? 409 : 404).json({
        success: false,
        message: exists
          ? 'Document has already been reviewed.'
          : 'Document not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Document ${status.toLowerCase()} successfully!`,
      document: doc
    });
  } catch (error) {
    console.error('Review document error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to review document.'
    });
  }
};
