const Car = require('../models/Car');
const CarHistory = require('../models/CarHistory');
const User = require('../models/User');

exports.createCar = async (req, res) => {
  try {
    const { 
      name, plateNumber, type, assignedDriver, status,
      brand, model, manufacturingYear, engineNumber, chassisNumber, 
      currentMileage, assignedSite, registrationDocuments
    } = req.body;
    const existingCar = await Car.findOne({ plateNumber });
    if (existingCar) {
      return res.status(400).json({ success: false, message: 'Plate number already exists' });
    }

    // Status mapping for backward compatibility
    let mappedStatus = status || 'Active';
    if (mappedStatus === 'UnderRepair') mappedStatus = 'Under Maintenance';
    if (mappedStatus === 'Inactive') mappedStatus = 'Out of Service';

    const carData = { 
      name, plateNumber, type, status: mappedStatus,
      brand: brand || '',
      model: model || '',
      manufacturingYear: manufacturingYear || null,
      engineNumber: engineNumber || '',
      chassisNumber: chassisNumber || '',
      currentMileage: currentMileage || 0,
      assignedSite: assignedSite || '',
      registrationDocuments: registrationDocuments || []
    };
    if (req.file) carData.photo = `/uploads/${req.file.filename}`;

    if (assignedDriver) {
      const driver = await User.findById(assignedDriver);
      if (!driver || driver.role !== 'Driver') {
        return res.status(400).json({ success: false, message: 'Invalid driver' });
      }
      carData.assignedDriver = assignedDriver;
    }

    const car = await Car.create(carData);

    if (assignedDriver) {
      await Car.updateMany({ assignedDriver, _id: { $ne: car._id } }, { assignedDriver: null });
      await User.findByIdAndUpdate(assignedDriver, { assignedCar: car._id });
    }

    const populated = await Car.findById(car._id).populate('assignedDriver', 'username fullName phone');
    res.status(201).json({ success: true, car: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getCars = async (req, res) => {
  try {
    const { status, search, type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) {
      let mappedStatus = status;
      if (mappedStatus === 'UnderRepair') mappedStatus = 'Under Maintenance';
      if (mappedStatus === 'Inactive') mappedStatus = 'Out of Service';
      query.status = mappedStatus;
    }
    if (type) query.type = { $regex: type, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { plateNumber: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [cars, total] = await Promise.all([
      Car.find(query).populate('assignedDriver', 'username fullName phone').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Car.countDocuments(query)
    ]);
    res.status(200).json({ success: true, cars, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate('assignedDriver', 'username fullName phone');
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    res.status(200).json({ success: true, car });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });

    const { 
      name, plateNumber, type, assignedDriver, status,
      brand, model, manufacturingYear, engineNumber, chassisNumber, 
      currentMileage, assignedSite, registrationDocuments
    } = req.body;

    if (name) car.name = name;
    if (plateNumber) car.plateNumber = plateNumber;
    if (type) car.type = type;
    
    if (status) {
      let mappedStatus = status;
      if (mappedStatus === 'UnderRepair') mappedStatus = 'Under Maintenance';
      if (mappedStatus === 'Inactive') mappedStatus = 'Out of Service';
      car.status = mappedStatus;
    }
    
    if (brand !== undefined) car.brand = brand;
    if (model !== undefined) car.model = model;
    if (manufacturingYear !== undefined) car.manufacturingYear = manufacturingYear;
    if (engineNumber !== undefined) car.engineNumber = engineNumber;
    if (chassisNumber !== undefined) car.chassisNumber = chassisNumber;
    if (currentMileage !== undefined) car.currentMileage = currentMileage;
    if (assignedSite !== undefined) car.assignedSite = assignedSite;
    if (registrationDocuments !== undefined) car.registrationDocuments = registrationDocuments;

    if (req.file) car.photo = `/uploads/${req.file.filename}`;

    if (assignedDriver !== undefined) {
      if (car.assignedDriver) await User.findByIdAndUpdate(car.assignedDriver, { assignedCar: null });
      if (assignedDriver) {
        const driver = await User.findById(assignedDriver);
        if (!driver || driver.role !== 'Driver') return res.status(400).json({ success: false, message: 'Invalid driver' });
        if (driver.assignedCar) await Car.findByIdAndUpdate(driver.assignedCar, { assignedDriver: null });
        await User.findByIdAndUpdate(assignedDriver, { assignedCar: car._id });
        car.assignedDriver = assignedDriver;
      } else {
        car.assignedDriver = null;
      }
    }

    await car.save();
    const updated = await Car.findById(car._id).populate('assignedDriver', 'username fullName phone');
    res.status(200).json({ success: true, car: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    if (car.assignedDriver) await User.findByIdAndUpdate(car.assignedDriver, { assignedCar: null });
    car.isDeleted = true;
    car.deletedAt = new Date();
    await car.save();
    res.status(200).json({ success: true, message: 'Car removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getCarHistory = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    const history = await CarHistory.find({ car: req.params.id })
      .populate('relatedIssueCase').populate('relatedSparePartRequest')
      .populate('relatedPurchaseRecord').populate('createdBy', 'username fullName')
      .sort({ date: -1 });
    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getAllCarHistories = async (req, res) => {
  try {
    const history = await CarHistory.find()
      .populate('car', 'name plateNumber type brand model status')
      .populate('driverReport')
      .populate('siteManagerReport')
      .populate('purchaseReport')
      .populate('receiptVerification')
      .populate('driverVerification')
      .populate('siteManagerVerification')
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

