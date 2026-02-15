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
  medicalType: {
    type: String,
    default: 'N/A',
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

// Add indexes for frequently queried fields to improve query performance
labNumberSchema.index({ number: 1 });
labNumberSchema.index({ patient: 1 });
labNumberSchema.index({ status: 1 });
labNumberSchema.index({ createdAt: -1 });
labNumberSchema.index({ medicalType: 1 });

module.exports = mongoose.model('LabNumber', labNumberSchema);
