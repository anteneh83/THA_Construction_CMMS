const express = require('express');
const router = express.Router();
const { getHandoverValidations, validateHandover } = require('../controllers/handoverValidationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('Admin'));

router.get('/', getHandoverValidations);
router.put('/:id/validate', validateHandover);

module.exports = router;
