const express = require('express');
const router = express.Router();
const { createCar, getCars, getCar, updateCar, deleteCar, getCarHistory, getAllCarHistories } = require('../controllers/carController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinaryUpload = require('../middleware/cloudinaryUpload');

router.use(protect);

router.get('/history/all', authorize('Admin'), getAllCarHistories);

router.route('/')
  .get(getCars)
  .post(authorize('Admin'), upload.single('photo'), cloudinaryUpload, createCar);

router.route('/:id')
  .get(getCar)
  .put(authorize('Admin'), upload.single('photo'), cloudinaryUpload, updateCar)
  .delete(authorize('Admin'), deleteCar);

router.get('/:id/history', getCarHistory);

module.exports = router;
