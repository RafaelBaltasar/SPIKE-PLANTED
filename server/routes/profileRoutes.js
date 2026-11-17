const express = require('express');
const router = express.Router();
const { getMyProfile, updateMyProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyProfile);
router.put('/', updateMyProfile);

module.exports = router;