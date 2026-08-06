const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Car = require('../models/Car');

// @desc    Create a new user (Admin only)
// @route   POST /api/users
exports.createUser = async (req, res) => {
  try {
    console.log('createUser payload:', req.body);
    const { username, password, role, fullName, phone, assignedCar } = req.body;

    if (!username || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username and role are required'
      });
    }

    const normalizedUsername = username.trim();
    const normalizedRole = role.trim();

    const allowedRoles = ['Driver', 'SiteManager', 'Accountant'];
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected'
      });
    }

    if (normalizedRole === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot create Admin accounts'
      });
    }

    if (password && password.length > 0 && password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    const generatedPassword = password || crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

    const userData = {
      username: normalizedUsername,
      password: generatedPassword,
      role: normalizedRole,
      fullName: fullName ? fullName.trim() : '',
      phone: phone ? phone.trim() : '',
      mustChangePassword: true
    };

    if (normalizedRole === 'Driver' && assignedCar) {
      if (!mongoose.Types.ObjectId.isValid(assignedCar)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assigned car selection'
        });
      }

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

    // If we generated a password, include it in the response so the admin
    // can communicate it to the new user. Do NOT expose this in logs.
    const responseBody = { success: true, user };
    if (!password) responseBody.tempPassword = generatedPassword;

    res.status(201).json(responseBody);
  } catch (error) {
    console.error('createUser error:', error);

    if (error.code === 11000 && error.keyValue && error.keyValue.username) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
        error: error.message
      });
    }

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
