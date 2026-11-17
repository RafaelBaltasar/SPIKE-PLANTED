const express = require('express');
const router = express.Router();

const {
  getAllStudents,
  getStudentRecord,
  updateStudentStatus,
  reviewJournal,
  reviewAttendance,
  getDashboardSummary,
  getPendingAttendance,
  getPendingAccounts, // <-- Added
  approveAccount      // <-- Added
} = require('../controllers/coordinatorController');

const {
  protect,
  authorize
} = require('../middleware/authMiddleware');

// All routes below require coordinator or admin access
router.use(protect, authorize('coordinator', 'admin'));

// Dashboard summary
router.get('/dashboard-summary', getDashboardSummary);

// Students
router.get('/students', getAllStudents);
router.get('/students/:studentId', getStudentRecord);
router.patch('/students/:studentId/status', updateStudentStatus);

// Journal review
router.patch('/journals/:id/review', reviewJournal);

// Attendance
router.get('/attendance', getPendingAttendance);
router.patch('/attendance/:id/review', reviewAttendance);

// ─────────────────────────────────────────────
// ADMIN: PENDING ACCOUNT APPROVALS
// ─────────────────────────────────────────────
router.get('/pending-accounts', getPendingAccounts);
router.patch('/pending-accounts/:id/approve', approveAccount);

module.exports = router;