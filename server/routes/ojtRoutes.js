
const express = require('express');
const router = express.Router();

const {
  getMyAttendance,
  timeIn,
  timeOut
} = require('../controllers/ojtController');

const {
  protect,
  authorize
} = require('../middleware/authMiddleware');

// Student attendance history
router.get(
  '/my-attendance',
  protect,
  authorize('student'),
  getMyAttendance
);

// Student time-in
router.post(
  '/time-in',
  protect,
  authorize('student'),
  timeIn
);

// Student time-out
router.post(
  '/time-out',
  protect,
  authorize('student'),
  timeOut
);

module.exports = router;
