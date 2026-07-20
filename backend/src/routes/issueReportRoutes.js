const express = require('express');
const router = express.Router();
const { createIssueReport, getIssueReports, getIssueReport } = require('../controllers/issueReportController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/')
  .get(getIssueReports)
  .post(authorize('Driver', 'SiteManager'), upload.single('photo'), createIssueReport);

router.route('/:id').get(getIssueReport);

module.exports = router;
