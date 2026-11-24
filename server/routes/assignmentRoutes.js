
const express = require('express');
const router = express.Router();

const {
  getAvailableStudents,
  getApprovedCompanies,
  assignStudent,
  getCompanyInterns,
  removeAssignment
} = require('../controllers/assignmentController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Coordinator and Admin routes
router.get(
  '/available-students',
  protect,
  authorize('coordinator', 'admin'),
  getAvailableStudents
);

router.get(
  '/approved-companies',
  protect,
  authorize('coordinator', 'admin'),
  getApprovedCompanies
);

router.post(
  '/',
  protect,
  authorize('coordinator', 'admin'),
  assignStudent
);

router.delete(
  '/:studentId',
  protect,
  authorize('coordinator', 'admin'),
  removeAssignment
);

// Company Supervisor route
router.get(
  '/company-interns',
  protect,
  authorize('staff'),
  getCompanyInterns
);

module.exports = router;
