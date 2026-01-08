const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  passportNumber: { type: String, required: true, unique: true },
  issuingCountry: { type: String, required: false },
  occupation: { type: String, required: false },
  sex: { type: String, required: true },
  age: { type: Number, required: true },
  photo: { type: String, required: false }, // Store image URL or base64
  medicalType: { type: String, required: true },
  agent: { type: String, required: false }, // Agent field
  paymentRecorded: { type: Boolean, default: false }, // Track if payment has been recorded
  // Additional fields that might be used
  height: { type: String, required: false },
  weight: { type: String, required: false },
  dateOfBirth: { type: Date, required: false },
  address: { type: String, required: false },
  contactNumber: { type: String, required: false },
}, { timestamps: true });

// Add indexes for better query performance
patientSchema.index({ name: 1 });
patientSchema.index({ passportNumber: 1 });
patientSchema.index({ medicalType: 1 });
patientSchema.index({ sex: 1 });
patientSchema.index({ createdAt: -1 });

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
