const Patient = require('../models/Patient');
const { deleteFromCloudinary, extractPublicId } = require('../config/cloudinary');

// Fetch all patients with pagination and optimizations
exports.getAllPatients = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 0,  // 0 means no limit (backward compatible)
      fields = '',
      excludePhoto = 'true' // Exclude photo by default to reduce payload
    } = req.query;
    
    const skip = limit > 0 ? (parseInt(page) - 1) * parseInt(limit) : 0;
    
    // Build field selection - exclude heavy photo field by default
    let selectFields = {};
    if (fields) {
      // If specific fields are requested
      fields.split(',').forEach(field => selectFields[field.trim()] = 1);
    } else if (excludePhoto === 'true') {
      // Default: exclude photo to reduce payload size
      selectFields = { photo: 0 };
    }
    
    let query = Patient.find().select(selectFields).lean(); // Use lean() for better performance
    
    if (limit > 0) {
      query = query.skip(skip).limit(parseInt(limit));
    }
    
    // Sort by most recent first for better UX
    query = query.sort({ createdAt: -1 });
    
    const patients = await query.exec();
    
    // Get total count for pagination (only if limit is set)
    let totalCount = 0;
    if (limit > 0) {
      totalCount = await Patient.countDocuments();
    }
    
    res.status(200).json({
      patients,
      pagination: limit > 0 ? {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasMore: skip + patients.length < totalCount
      } : null
    });
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

// Create a new patient
exports.createPatient = async (req, res) => {
  const { name, passportNumber, issuingCountry, occupation, sex, height, weight, age, medicalType, agent } = req.body;
  
  // Cloudinary automatically uploads and returns the secure URL
  const photoUrl = req.file ? req.file.path : ''; // Cloudinary path is in req.file.path

  const patient = new Patient({
    name: name ? name.trim() : name, // Trim whitespace from name
    passportNumber: passportNumber ? passportNumber.trim() : passportNumber,
    issuingCountry,
    occupation,
    sex,
    height,
    weight,
    age,
    photo: photoUrl, // Store Cloudinary URL instead of base64
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
    // Remove fields that shouldn't be updated
    const { _id, __v, createdAt, updatedAt, ...updateData } = req.body;
    
    // Handle photo upload if a new file is provided
    if (req.file) {
      // Get the old patient data to delete old photo from Cloudinary
      const oldPatient = await Patient.findById(req.params.id);
      
      if (oldPatient && oldPatient.photo) {
        // Extract public ID from old Cloudinary URL and delete it
        const oldPublicId = extractPublicId(oldPatient.photo);
        if (oldPublicId) {
          await deleteFromCloudinary(oldPublicId).catch(err => 
            console.error('Failed to delete old photo from Cloudinary:', err)
          );
        }
      }
      
      // Store new Cloudinary URL
      updateData.photo = req.file.path;
    }
    
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { 
        new: true, 
        runValidators: true // Ensure validations run on update
      }
    );
    
    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    console.log(`✅ Patient updated: "${updatedPatient.name}" (${updatedPatient.passportNumber})`);
    res.status(200).json(updatedPatient);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => error.errors[key].message) : []
    });
  }
};

// Delete a patient
exports.deletePatient = async (req, res) => {
  try {
    const deletedPatient = await Patient.findByIdAndDelete(req.params.id);
    if (!deletedPatient) return res.status(404).json({ message: 'Patient not found' });
    
    // Delete patient photo from Cloudinary if it exists
    if (deletedPatient.photo) {
      const publicId = extractPublicId(deletedPatient.photo);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch(err => 
          console.error('Failed to delete photo from Cloudinary:', err)
        );
      }
    }
    
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
