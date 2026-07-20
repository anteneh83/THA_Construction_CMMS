const express = require('express');
const router = express.Router();
const { createIssueCase, getIssueCases, getIssueCase, validateIssueCase } = require('../controllers/issueCaseController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('Admin'));

router.route('/').get(getIssueCases).post(createIssueCase);
router.route('/:id').get(getIssueCase);
router.put('/:id/validate', validateIssueCase);

module.exports = router;
