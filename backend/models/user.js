const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: false,
  },
  role: {
    type: String,
    enum: ['Super Admin', 'Admin', 'Manager', 'Supervisor', 'User', 'Guest'],
    default: 'User',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  departments: [{
    type: String,
    enum: ['Agent', 'Front Office', 'Phlebotomy', 'Laboratory', 'Radiology', 'Clinical', 'Accounts', 'Admin'],
  }],
  permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true }); // Enable timestamps

// Hash password before saving the user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next(); // Ensure early return
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next(); // Proceed after hashing
  } catch (err) {
    next(err); // Pass any error to the next middleware
  }
});

// Compare hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
