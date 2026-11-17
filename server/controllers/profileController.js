const User = require('../models/User');
const Student = require('../models/Student');
const Document = require('../models/Document');
const Company = require('../models/Company');

// GET MY PROFILE
exports.getMyProfile = async (req, res) => {
  try {
    // Get user and populate their student profile
    const user = await User.findById(req.user._id).populate('student');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    let companyData = null;
    
    // If the student has a company assigned, fetch it
    if (user.student && user.student.company) {
      companyData = await Company.findOne({ name: user.student.company });
    }

    // Get their documents
    const documents = user.student 
      ? await Document.find({ student: user.student._id }) 
      : [];

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      student: user.student,
      company: companyData,
      documents
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to load profile.' });
  }
};

// UPDATE MY PROFILE
exports.updateMyProfile = async (req, res) => {
  try {
    const { fullName, email, contactNumber } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Update User
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    await user.save();

    // Update Student Profile if exists
    if (user.student) {
      const student = await Student.findById(user.student);
      if (student) {
        student.firstName = fullName ? fullName.split(' ')[0] : student.firstName;
        student.lastName = fullName ? fullName.split(' ').slice(-1)[0] : student.lastName;
        student.contactNumber = contactNumber || student.contactNumber;
        await student.save();
      }
    }

    return res.status(200).json({ success: true, message: 'Profile updated successfully!', user });
  } catch (error) {
    console.error('Update profile error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};