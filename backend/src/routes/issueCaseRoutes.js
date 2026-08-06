const express = require('express');
const router = express.Router();
const { createIssueCase, getIssueCases, getIssueCase, validateIssueCase, getActiveIssueCases } = require('../controllers/issueCaseController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/active', getActiveIssueCases);
router.use(authorize('Admin'));

router.route('/').get(getIssueCases).post(createIssueCase);
router.route('/:id').get(getIssueCase);
router.put('/:id/validate', validateIssueCase);

module.exports = router;
