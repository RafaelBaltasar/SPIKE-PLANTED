
const express = require('express');
const router = express.Router();

const {
  getDashboardSummary,
  approveUserAccount,
  getSystemReports
} = require('../controllers/adminController');

const {
  protect,
  authorize
} = require('../middleware/authMiddleware');

// All routes require Admin access.
router.use(protect, authorize('admin'));

// Admin Dashboard
router.get('/dashboard-summary', getDashboardSummary);

// Approve Coordinator/Admin accounts
router.patch('/users/:userId/approve', approveUserAccount);

// System Reports
router.get('/reports', getSystemReports);

module.exports = router;
