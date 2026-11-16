const express = require('express');
const router = express.Router();

const {
  getAllStudents,
  getStudentRecord,
  reviewJournal,
  reviewAttendance
} = require('../controllers/coordinatorController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All routes below require coordinator or admin
router.use(protect, authorize('coordinator', 'admin'));

// Students
router.get('/students', getAllStudents);
router.get('/students/:studentId', getStudentRecord);

// Journal & attendance review
router.patch('/journals/:id/review', reviewJournal);
router.patch('/attendance/:id/review', reviewAttendance);

module.exports = router;