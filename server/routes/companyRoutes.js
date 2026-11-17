const express = require('express');
const router = express.Router();

const { 
  getAllCompanies, 
  approveCompany, 
  rejectCompany 
} = require('../controllers/companyController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin'));

router.get('/', getAllCompanies);
router.patch('/:id/approve', approveCompany);
router.patch('/:id/reject', rejectCompany);

module.exports = router;