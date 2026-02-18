const Patient = require('../models/Patient');
const { deleteFromCloudinary, extractPublicId } = require('../config/cloudinary');

// Fetch all patients with pagination and optimizations
exports.getAllPatients = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit,
      fields = '',
      excludePhoto = 'true', // Exclude photo by default to reduce payload
      name = ''              // Optional: filter by patient name (partial, case-insensitive)
    } = req.query;

    const defaultLimit = parseInt(process.env.DEFAULT_PATIENT_LIMIT || '300', 10);
    const maxLimit = parseInt(process.env.MAX_PATIENT_LIMIT || '1000', 10);
    const hasCustomLimit = limit !== undefined;
    const parsedLimit = parseInt(limit, 10);
    const effectiveLimit = hasCustomLimit
      ? (Number.isNaN(parsedLimit) ? defaultLimit : Math.min(Math.max(parsedLimit, 0), maxLimit))
      : defaultLimit;
    
    const skip = effectiveLimit > 0 ? (parseInt(page) - 1) * effectiveLimit : 0;
    
    // Build field selection - exclude heavy photo field by default
    let selectFields = {};
    if (fields) {
      // If specific fields are requested
      fields.split(',').forEach(field => selectFields[field.trim()] = 1);
    } else if (excludePhoto === 'true') {
      // Default: exclude photo to reduce payload size
      selectFields = { photo: 0 };
    }
    
    // Build base filter — support optional name search
    const baseFilter = name
      ? { name: { $regex: name.trim(), $options: 'i' } }
      : {};

    // When specific fields are requested (e.g. ?fields=name,photo), the caller
    // just wants a lightweight projection — skip countDocuments entirely so we
    // avoid an extra full-collection scan on every department page load.
    const needsPaginationMeta = !fields && effectiveLimit > 0;

    const findQuery = Patient.find(baseFilter)
      .select(selectFields)
      .sort({ createdAt: -1 })
      .lean();

    if (effectiveLimit > 0) {
      findQuery.skip(skip).limit(effectiveLimit);
    }

    // Run find and (optionally) countDocuments in parallel
    const [patients, totalCount] = await Promise.all([
      findQuery.exec(),
      needsPaginationMeta ? Patient.countDocuments(baseFilter) : Promise.resolve(0)
    ]);

    // Guard against double-response when the timeout middleware fired first
    if (res.headersSent) return;

    res.status(200).json({
      patients,
      pagination: needsPaginationMeta ? {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / effectiveLimit),
        totalCount,
        hasMore: skip + patients.length < totalCount
      } : null
    });
  } catch (error) {
    if (res.headersSent) return;
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

    // Get names of patients that already have a "Paid" account record.
    const paidPatientNames = await accounts.distinct('patientName', { paymentStatus: 'Paid' });

    // Single query: patients not marked paid AND not in the paid-accounts list.
    const pendingPatients = await Patient.find({
      paymentRecorded: { $ne: true },
      name: { $nin: paidPatientNames }
    })
      .select('-photo') // exclude heavy photo field
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(pendingPatients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patients without lab numbers assigned
// Uses a DB-level aggregation instead of fetching all documents into JS memory.
exports.getPatientsWithoutLabNumbers = async (req, res) => {
  try {
    const patientsWithoutLabNumbers = await Patient.aggregate([
      {
        $lookup: {
          from: 'labnumbers',
          localField: 'name',
          foreignField: 'patient',
          as: 'labNumbers'
        }
      },
      { $match: { labNumbers: { $size: 0 } } },
      {
        $project: {
          photo: 0,
          labNumbers: 0
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    if (res.headersSent) return;

    console.log(`✅ Patients without lab numbers: ${patientsWithoutLabNumbers.length}`);
    res.status(200).json(patientsWithoutLabNumbers);
  } catch (error) {
    console.error('❌ Error in getPatientsWithoutLabNumbers:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
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
