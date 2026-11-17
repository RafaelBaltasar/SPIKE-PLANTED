const express = require('express');
const router = express.Router();

// Import the new uploadAvatar function
const { 
  getMyProfile, 
  updateMyProfile, 
  uploadAvatar 
} = require('../controllers/profileController');

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Import the multer middleware

// All routes below require the user to be logged in
router.use(protect);

// Get profile data
router.get('/', getMyProfile);

// Update text fields (name, email, etc.)
router.put('/', updateMyProfile);

// Upload a new profile picture
router.post('/avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;