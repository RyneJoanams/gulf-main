const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const LabNumber = require('../models/labNumber');

// GET patient data by lab number
router.get('/:labNumber', async (req, res) => {
  try {
    const { labNumber } = req.params;
    
    // First, find the lab number record to get the patient name
    const labRecord = await LabNumber.findOne({ number: labNumber });
    
    if (!labRecord) {
      return res.status(404).json({ message: 'Lab number not found' });
    }
    
    // Then find the patient by name (or passport number if that's how they're linked)
    const patient = await Patient.findOne({ name: labRecord.patient });
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json({
      patientName: patient.name,
      passportNumber: patient.passportNumber,
      medicalType: patient.medicalType,
      sex: patient.sex,
      age: patient.age,
      occupation: patient.occupation,
      issuingCountry: patient.issuingCountry
    });
    
  } catch (error) {
    console.error('Error fetching patient data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;