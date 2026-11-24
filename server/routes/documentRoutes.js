
const express = require('express');
const router = express.Router();

const {
  uploadDocument,
  getMyDocuments,
  getAllDocuments,
  reviewDocument,
  getRequiredDocuments,
  createRequiredDocument,
  toggleRequiredDocument,
  getActiveRequirements
} = require('../controllers/documentController');

const {
  protect,
  authorize
} = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

// ============================================================
// REQUIREMENT MANAGEMENT
// ============================================================

// Staff / Coordinator / Admin: View managed requirements
router.get(
  '/requirements/manage',
  protect,
  authorize('staff', 'coordinator', 'admin'),
  getRequiredDocuments
);

// Staff / Coordinator / Admin: Create requirement
router.post(
  '/requirements',
  protect,
  authorize('staff', 'coordinator', 'admin'),
  createRequiredDocument
);

// Staff / Coordinator / Admin: Activate or hide requirement
router.patch(
  '/requirements/:id/toggle',
  protect,
  authorize('staff', 'coordinator', 'admin'),
  toggleRequiredDocument
);

// Student: View active requirements for assigned company
router.get(
  '/requirements',
  protect,
  authorize('student'),
  getActiveRequirements
);

// ============================================================
// STUDENT DOCUMENTS
// ============================================================

// Student: Upload document
router.post(
  '/',
  protect,
  authorize('student'),
  upload.single('file'),
  uploadDocument
);

// Student: View own documents
router.get(
  '/my-documents',
  protect,
  authorize('student'),
  getMyDocuments
);

// ============================================================
// COORDINATOR / ADMIN DOCUMENT REVIEW
// ============================================================

// Coordinator/Admin: View all documents
router.get(
  '/',
  protect,
  authorize('coordinator', 'admin'),
  getAllDocuments
);

// Coordinator/Admin: Approve or reject document
router.patch(
  '/:id/review',
  protect,
  authorize('coordinator', 'admin'),
  reviewDocument
);

module.exports = router;
