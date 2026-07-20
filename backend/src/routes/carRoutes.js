const express = require('express');
const router = express.Router();
const { createCar, getCars, getCar, updateCar, deleteCar, getCarHistory, getAllCarHistories } = require('../controllers/carController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/history/all', authorize('Admin'), getAllCarHistories);

router.route('/')
  .get(getCars)
  .post(authorize('Admin'), upload.single('photo'), createCar);

router.route('/:id')
  .get(getCar)
  .put(authorize('Admin'), upload.single('photo'), updateCar)
  .delete(authorize('Admin'), deleteCar);

router.get('/:id/history', getCarHistory);

module.exports = router;
