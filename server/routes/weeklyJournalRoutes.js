
const express = require('express');
const router = express.Router();

const {
  getMyJournals,
  createJournal,
  updateJournal,
  submitJournal
} = require('../controllers/weeklyJournalController');

const {
  protect,
  authorize
} = require('../middleware/authMiddleware');

// Student: View own weekly journals
router.get(
  '/my-journals',
  protect,
  authorize('student'),
  getMyJournals
);

// Student: Create a weekly journal
router.post(
  '/',
  protect,
  authorize('student'),
  createJournal
);

// Student: Update a draft journal
router.put(
  '/:id',
  protect,
  authorize('student'),
  updateJournal
);

// Student: Submit a journal for coordinator review
router.patch(
  '/:id/submit',
  protect,
  authorize('student'),
  submitJournal
);

module.exports = router;
