const User = require('../models/User');
const Car = require('../models/Car');

// @desc    Create a new user (Admin only)
// @route   POST /api/users
exports.createUser = async (req, res) => {
  try {
    const { username, password, role, fullName, phone, assignedCar } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Only Admin can create users, and they cannot create other Admins
    if (role === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot create Admin accounts'
      });
    }

    const userData = {
      username,
      password,
      role,
      fullName: fullName || '',
      phone: phone || '',
      mustChangePassword: true
    };

    // If Driver, optionally assign a car
    if (role === 'Driver' && assignedCar) {
      const car = await Car.findById(assignedCar);
      if (!car) {
        return res.status(404).json({
          success: false,
          message: 'Assigned car not found'
        });
      }
      userData.assignedCar = assignedCar;
    }

    const user = await User.create(userData);

    // If driver was assigned a car, update the car's assignedDriver
    if (role === 'Driver' && assignedCar) {
      await Car.findByIdAndUpdate(assignedCar, { assignedDriver: user._id });
    }

    res.status(201).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all users (filtered by role)
// @route   GET /api/users?role=Driver
exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('assignedCar', 'name plateNumber type status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('assignedCar', 'name plateNumber type status photo');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { fullName, phone, assignedCar, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;

    // Update password if provided (admin reset)
    if (password) {
      user.password = password;
      user.mustChangePassword = true;
    }

    // Handle car assignment for drivers
    if (user.role === 'Driver' && assignedCar !== undefined) {
      // Unassign old car
      if (user.assignedCar) {
        await Car.findByIdAndUpdate(user.assignedCar, { assignedDriver: null });
      }

      if (assignedCar) {
        // Assign new car
        const car = await Car.findById(assignedCar);
        if (!car) {
          return res.status(404).json({
            success: false,
            message: 'Car not found'
          });
        }
        // Unassign car from previous driver
        if (car.assignedDriver && car.assignedDriver.toString() !== user._id.toString()) {
          await User.findByIdAndUpdate(car.assignedDriver, { assignedCar: null });
        }
        await Car.findByIdAndUpdate(assignedCar, { assignedDriver: user._id });
        user.assignedCar = assignedCar;
      } else {
        user.assignedCar = null;
      }
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate('assignedCar', 'name plateNumber type status photo');

    res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Soft delete user
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete Admin accounts'
      });
    }

    // Unassign car if driver
    if (user.role === 'Driver' && user.assignedCar) {
      await Car.findByIdAndUpdate(user.assignedCar, { assignedDriver: null });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
