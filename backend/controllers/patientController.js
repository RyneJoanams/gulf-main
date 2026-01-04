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
  const { name, passportNumber, issuingCountry, occupation, sex, height, weight, age, medicalType, agent } = req.body;
  let photoBase64 = '';

  // Convert image to base64 and store it in the database
  if (req.file) {
    photoBase64 = convertImageToBase64(req.file.path);
  }

  const patient = new Patient({
    name: name ? name.trim() : name, // Trim whitespace from name
    passportNumber: passportNumber ? passportNumber.trim() : passportNumber,
    issuingCountry,
    occupation,
    sex,
    height,
    weight,
    age,
    photo: photoBase64, // Storing the photo as a base64 string
    medicalType,
    agent, // Include agent field
  });

  try {
    const savedPatient = await patient.save();
    console.log(`✅ New patient created: "${savedPatient.name}" (${savedPatient.medicalType})`);
    res.status(201).json(savedPatient);
  } catch (error) {
    console.error('❌ Error creating patient:', error);
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

// Get patients without lab numbers assigned
exports.getPatientsWithoutLabNumbers = async (req, res) => {
  try {
    const LabNumber = require('../models/labNumber');
    
    console.log('🔍 Fetching patients without lab numbers...');
    
    // Get total counts for debugging
    const totalPatients = await Patient.countDocuments();
    const totalLabNumbers = await LabNumber.countDocuments();
    console.log(`📊 Total patients in DB: ${totalPatients}`);
    console.log(`📊 Total lab numbers in DB: ${totalLabNumbers}`);
    
    // Get all patients sorted by creation date
    const allPatients = await Patient.find().sort({ createdAt: -1 });
    
    // Get all lab numbers with patient names
    const assignedLabNumbers = await LabNumber.find().select('patient');
    
    // Create a Set of normalized patient names that have lab numbers
    const assignedNamesSet = new Set(
      assignedLabNumbers.map(lab => lab.patient.trim().toLowerCase())
    );
    
    console.log(`📋 Patients with lab numbers: ${assignedNamesSet.size}`);
    console.log(`📋 Sample names with labs:`, Array.from(assignedNamesSet).slice(0, 3));
    
    // Filter patients who don't have lab numbers (case-insensitive, trimmed comparison)
    const patientsWithoutLabNumbers = allPatients.filter(patient => {
      const normalizedPatientName = patient.name.trim().toLowerCase();
      const hasLabNumber = assignedNamesSet.has(normalizedPatientName);
      
      if (!hasLabNumber) {
        console.log(`   ✓ Pending: "${patient.name}" (${patient.medicalType})`);
      }
      
      return !hasLabNumber;
    });
    
    console.log(`✅ Found ${patientsWithoutLabNumbers.length} patients without lab numbers`);
    
    if (patientsWithoutLabNumbers.length > 0) {
      console.log(`📝 First pending patient: ${patientsWithoutLabNumbers[0].name} (${patientsWithoutLabNumbers[0].medicalType})`);
    } else {
      console.log(`ℹ️  All patients have lab numbers assigned`);
    }
    
    res.status(200).json(patientsWithoutLabNumbers);
  } catch (error) {
    console.error('❌ Error in getPatientsWithoutLabNumbers:', error);
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
