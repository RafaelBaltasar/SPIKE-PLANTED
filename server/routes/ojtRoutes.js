
const express = require('express');
const router = express.Router();

const {
  getMyAttendance,
  timeIn,
  timeOut,
  getCompanyPendingAttendance,
  reviewAttendanceBySupervisor
} = require('../controllers/ojtController');

const {
  protect,
  authorize
} = require('../middleware/authMiddleware');

// =============================================
// STUDENT ROUTES
// =============================================

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


// =============================================
// SUPERVISOR ROUTES
// =============================================

// Get completed attendance awaiting supervisor sign-off
router.get(
  '/company-pending',
  protect,
  authorize('staff'),
  getCompanyPendingAttendance
);

// Approve or reject attendance as supervisor
router.patch(
  '/:id/supervisor-review',
  protect,
  authorize('staff'),
  reviewAttendanceBySupervisor
);

module.exports = router;
