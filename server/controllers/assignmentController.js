
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Company = require('../models/Company');

// GET: Students who are not yet assigned to a company
exports.getAvailableStudents = async (req, res) => {
  try {
    const students = await Student.find({
      $or: [
        { companyId: null },
        { companyId: { $exists: false } }
      ]
    }).sort({ lastName: 1, firstName: 1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Get available students error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve available students.'
    });
  }
};

// GET: Approved companies for student assignment
exports.getApprovedCompanies = async (req, res) => {
  try {
    const companies = await Company.find({
      status: 'Approved'
    })
      .select('name contactPerson email')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: companies.length,
      companies
    });
  } catch (error) {
    console.error('Get approved companies error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve approved companies.'
    });
  }
};

// POST: Assign or change a student's company
exports.assignStudent = async (req, res) => {
  try {
    const { studentId, companyId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(companyId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid student ID and company ID are required.'
      });
    }

    const [student, company] = await Promise.all([
      Student.findById(studentId),
      Company.findById(companyId)
    ]);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      });
    }

    if (company.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Students can only be assigned to approved companies.'
      });
    }

    const previousCompanyId = student.companyId
      ? student.companyId.toString()
      : null;

    const newCompanyId = company._id.toString();

    if (previousCompanyId === newCompanyId) {
      return res.status(200).json({
        success: true,
        message: 'Student is already assigned to this company.',
        student: await Student.findById(student._id)
          .populate('companyId', 'name email status')
      });
    }

    student.companyId = company._id;
    await student.save();

    const updatedStudent = await Student.findById(student._id)
      .populate('companyId', 'name email status');

    return res.status(200).json({
      success: true,
      message: previousCompanyId
        ? 'Student company assignment successfully updated.'
        : 'Student successfully assigned to company.',
      student: updatedStudent
    });
  } catch (error) {
    console.error('Assign or change student company error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to save student company assignment.'
    });
  }
};

// GET: Interns assigned to the logged-in supervisor's company
exports.getCompanyInterns = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(403).json({
        success: false,
        message: 'Your supervisor account is not linked to a company.'
      });
    }

    const company = await Company.findById(companyId);

    if (!company || company.status !== 'Approved') {
      return res.status(403).json({
        success: false,
        message: 'Your assigned company is not approved or no longer available.'
      });
    }

    const students = await Student.find({
      companyId: company._id
    }).sort({ lastName: 1, firstName: 1 });

    return res.status(200).json({
      success: true,
      company: {
        id: company._id,
        name: company.name
      },
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Get company interns error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve company interns.'
    });
  }
};

// DELETE: Remove a student's company assignment
exports.removeAssignment = async (req, res) => {
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

    if (!student.companyId) {
      return res.status(400).json({
        success: false,
        message: 'This student has no company assignment.'
      });
    }

    student.companyId = null;
    await student.save();

    return res.status(200).json({
      success: true,
      message: 'Student assignment successfully removed.'
    });
  } catch (error) {
    console.error('Remove assignment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to remove student assignment.'
    });
  }
};
