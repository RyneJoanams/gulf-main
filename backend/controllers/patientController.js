const Patient = require('../models/Patient');
const fs = require('fs');

// Fetch all patients
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find();
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch a patient by ID
exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to convert image to base64
const convertImageToBase64 = (filePath) => {
  const imageBuffer = fs.readFileSync(filePath);
  return imageBuffer.toString('base64');
};

// Create a new patient
exports.createPatient = async (req, res) => {
  const { name, passportNumber, issuingCountry, occupation, sex, height, weight, age, medicalType } = req.body;
  let photoBase64 = '';

  // Convert image to base64 and store it in the database
  if (req.file) {
    photoBase64 = convertImageToBase64(req.file.path);
  }

  const patient = new Patient({
    name,
    passportNumber,
    issuingCountry,
    occupation,
    sex,
    height,
    weight,
    age,
    photo: photoBase64, // Storing the photo as a base64 string
    medicalType,
  });

  try {
    const savedPatient = await patient.save();
    res.status(201).json(savedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a patient
exports.updatePatient = async (req, res) => {
  try {
    const updatedPatient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPatient) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json(updatedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a patient
exports.deletePatient = async (req, res) => {
  try {
    const deletedPatient = await Patient.findByIdAndDelete(req.params.id);
    if (!deletedPatient) return res.status(404).json({ message: 'Patient not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patients pending payment recording
exports.getPatientsPendingPayment = async (req, res) => {
  try {
    const accounts = require('../models/accounts');
    
    // Get all patients who don't have paymentRecorded flag set to true
    const allPendingPatients = await Patient.find({ paymentRecorded: { $ne: true } }).sort({ createdAt: -1 });
    
    // Get all patients who have payment records with "Paid" status
    const paidPatients = await accounts.find({ paymentStatus: 'Paid' }).distinct('patientName');
    
    // Filter out patients who already have paid status
    const actuallyPendingPatients = allPendingPatients.filter(patient => 
      !paidPatients.includes(patient.name)
    );
    
    res.status(200).json(actuallyPendingPatients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark patient payment as recorded
exports.markPaymentRecorded = async (req, res) => {
  try {
    const { patientName } = req.body;
    const patient = await Patient.findOneAndUpdate(
      { name: patientName },
      { paymentRecorded: true },
      { new: true }
    );
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
