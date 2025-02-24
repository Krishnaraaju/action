const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.fullName = req.body.fullName || user.fullName;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      status: 'success',
      data: {
        user: {
          id: updatedUser._id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          role: updatedUser.role
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Switch user role
// @route   POST /api/users/switch-role
// @access  Private
const switchRole = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.role !== 'both') {
      return res.status(400).json({
        status: 'error',
        message: 'User does not have permission to switch roles'
      });
    }

    // Toggle between buyer and seller mode
    user.currentRole = user.currentRole === 'buyer' ? 'seller' : 'buyer';
    await user.save();

    res.json({
      status: 'success',
      data: {
        currentRole: user.currentRole
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  switchRole
}; 