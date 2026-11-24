const User = require('../models/User');
const Student = require('../models/Student');
const Document = require('../models/Document');
const Company = require('../models/Company');
const path = require('path');
const fs = require('fs');

// GET MY PROFILE
exports.getMyProfile = async (req, res) => {
  try {
    // Get user and populate their student profile
    const user = await User.findById(req.user._id).populate('student');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    let companyData = null;
    
    // If the student has a company assigned, fetch it
    if (user.student && user.student.companyId) {
      companyData = await Company.findById(user.student.companyId);
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
        avatar: user.avatar, // <-- Added avatar
        company: user.company,
        department: user.department
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

    const normalizedEmail = email?.trim().toLowerCase() || user.email;

    if (normalizedEmail !== user.email) {
      const duplicate = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id }
      });

      if (duplicate) {
        return res.status(400).json({ success: false, message: 'Email already registered.' });
      }
    }

    // Update User
    user.fullName = fullName || user.fullName;
    user.email = normalizedEmail;
    await user.save();

    // Update Student Profile if exists
    if (user.student) {
      const student = await Student.findById(user.student);
      if (student) {
        student.firstName = fullName ? fullName.split(' ')[0] : student.firstName;
        student.lastName = fullName ? fullName.split(' ').slice(-1)[0] : student.lastName;
        student.contactNumber = contactNumber || student.contactNumber;
        student.email = normalizedEmail;
        await student.save();
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully!', 
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      } 
    });
  } catch (error) {
    console.error('Update profile error:', error.message);

    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// UPLOAD PROFILE PICTURE (AVATAR)
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Optional: Delete old avatar file if it exists to save space
    if (user.avatar) {
      // Construct the full path of the old image
      const oldPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save the new path to the database (Multer saves it to uploads/documents by default, we'll use that)
    user.avatar = `/uploads/documents/${req.file.filename}`;
    await user.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Profile picture updated!', 
      avatar: user.avatar 
    });
  } catch (error) {
    console.error('Upload avatar error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to upload picture.' });
  }
};