const express = require('express');
const router = express.Router();

const {
  uploadDocument,
  getMyDocuments,
  getAllDocuments,
  reviewDocument
} = require('../controllers/documentController');

const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Student: Upload a document
router.post(
  '/',
  protect,
  authorize('student'),
  upload.single('file'),
  uploadDocument
);

// Student: Get my documents
router.get(
  '/my-documents',
  protect,
  authorize('student'),
  getMyDocuments
);

// Coordinator/Admin: Get all documents
router.get(
  '/',
  protect,
  authorize('coordinator', 'admin'),
  getAllDocuments
);

// Coordinator/Admin: Approve/Reject a document
router.patch(
  '/:id/review',
  protect,
  authorize('coordinator', 'admin'),
  reviewDocument
);

module.exports = router;