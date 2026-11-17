const Company = require('../models/Company');
const User = require('../models/User');

// ADMIN: Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, companies });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch companies.' });
  }
};

// ADMIN: Approve a company request
exports.approveCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Update company status to Approved
    const company = await Company.findByIdAndUpdate(
      id, 
      { status: 'Approved' }, 
      { new: true }
    );

    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });

    // 2. Activate the Supervisor's User account automatically so they can log in
    await User.findOneAndUpdate(
      { email: company.email },
      { isActive: true }
    );

    return res.status(200).json({ success: true, message: 'Company approved and supervisor activated!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to approve company.' });
  }
};

// ADMIN: Reject a company request
exports.rejectCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await Company.findByIdAndUpdate(
      id, 
      { status: 'Rejected' }, 
      { new: true }
    );

    return res.status(200).json({ success: true, message: 'Company rejected.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reject company.' });
  }
};