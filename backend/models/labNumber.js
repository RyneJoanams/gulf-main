const mongoose = require('mongoose');

const labNumberSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true,
  },
  patient: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  completedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LabNumber', labNumberSchema);
