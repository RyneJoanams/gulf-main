const Lab = require('../models/lab');
const Clinical = require('../models/clinical');
const Patient = require('../models/Patient');
const fs = require('fs');

// Helper function to convert image to base64
const convertImageToBase64 = (filePath) => {
  const imageBuffer = fs.readFileSync(filePath);
  return imageBuffer.toString('base64');
};

exports.createLabReport = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    
    let patientImageBase64 = '';

    // Check if `patientImage` is provided in the request body (optional)
    if (req.body.patientImage) {
      // If it's a file path, convert it to Base64
      if (fs.existsSync(req.body.patientImage)) {
        patientImageBase64 = convertImageToBase64(req.body.patientImage);
      } else {
        // Assume it's already a Base64 string
        patientImageBase64 = req.body.patientImage;
      }
    }

    // Convert uploaded file (if present) to Base64
    if (req.file) {
      patientImageBase64 = convertImageToBase64(req.file.path);
    }

    const labData = {
      patientId: req.body.patientId,
      patientName: req.body.patientName,
      labNumber: req.body.labNumber,
      // Only include patientImage if it exists
      ...(patientImageBase64 && { patientImage: patientImageBase64 }),
      timeStamp: req.body.timeStamp || Date.now(),
      medicalType: req.body.medicalType || 'N/A',
      labRemarks: req.body.labRemarks,
      // Extract test data from request body
      urineTest: req.body.urineTest,
      bloodTest: req.body.bloodTest,
      area1: req.body.area1,
      renalFunction: req.body.renalFunction,
      fullHaemogram: req.body.fullHaemogram,
      liverFunction: req.body.liverFunction,
    };

    console.log("Lab data to save:", labData);

    const lab = new Lab(labData);
    const savedLab = await lab.save();

    // Auto-create clinical report for S-series tests
    if (labData.labNumber && labData.labNumber.includes('-S')) {
      try {
        console.log("Creating automatic clinical report for S-series test:", labData.labNumber);
        
        // Fetch patient details to get complete information
        let patientDetails = null;
        if (labData.patientName) {
          const patient = await Patient.findOne({ 
            name: { $regex: new RegExp(labData.patientName, 'i') }
          });
          if (patient) {
            patientDetails = {
              passportNumber: patient.passportNumber,
              gender: patient.sex,
              age: patient.age,
              agent: patient.agent
            };
          }
        }

        // Create automatic clinical report for S-series
        const autoClinicalReport = new Clinical({
          selectedReport: {
            patientName: labData.patientName,
            labNumber: labData.labNumber,
            medicalType: labData.medicalType || 'N/A',
            patientImage: labData.patientImage,
            timeStamp: labData.timeStamp,
            // Include all lab test data
            urineTest: labData.urineTest,
            bloodTest: labData.bloodTest,
            area1: labData.area1,
            renalFunction: labData.renalFunction,
            fullHaemogram: labData.fullHaemogram,
            liverFunction: labData.liverFunction,
            labRemarks: labData.labRemarks
          },
          // Include patient details if available
          ...(patientDetails && {
            passportNumber: patientDetails.passportNumber,
            gender: patientDetails.gender,
            age: patientDetails.age,
            agent: patientDetails.agent
          }),
          // Default clinical data for S-series (no additional clinical examination needed)
          generalExamination: {},
          systemicExamination: {},
          otherTests: {},
          clinicalNotes: "Auto-generated for S-series test - No additional clinical examination required",
          clinicalOfficerName: "System Auto-Generated",
          height: "",
          weight: "",
          historyOfPastIllness: "",
          allergy: "",
          radiologyData: {
            heafMantouxTest: null,
            chestXRayTest: null
          }
        });

        await autoClinicalReport.save();
        console.log("Auto-clinical report created successfully for S-series:", labData.labNumber);
      } catch (clinicalError) {
        console.error("Error creating auto-clinical report for S-series:", clinicalError);
        // Don't fail the lab report creation if clinical auto-creation fails
      }
    }

    // Update existing clinical report for F-series (FM patients)
    // FM patients go through: Phlebotomy -> Clinical -> Lab
    // When Lab completes the work, update the existing clinical report with complete lab data
    if (labData.labNumber && labData.labNumber.includes('-F')) {
      try {
        console.log("Updating clinical report with complete lab data for F-series:", labData.labNumber);
        
        // Find the existing clinical report for this lab number
        const existingClinicalReport = await Clinical.findOne({ 
          'selectedReport.labNumber': labData.labNumber 
        });

        if (existingClinicalReport) {
          console.log("Found existing clinical report, updating with lab data...");
          
          // Update the selectedReport with complete lab data
          existingClinicalReport.selectedReport = {
            ...existingClinicalReport.selectedReport.toObject(),
            // Update with the complete lab test results
            urineTest: labData.urineTest || existingClinicalReport.selectedReport.urineTest,
            bloodTest: labData.bloodTest || existingClinicalReport.selectedReport.bloodTest,
            area1: labData.area1 || existingClinicalReport.selectedReport.area1,
            renalFunction: labData.renalFunction || existingClinicalReport.selectedReport.renalFunction,
            fullHaemogram: labData.fullHaemogram || existingClinicalReport.selectedReport.fullHaemogram,
            liverFunction: labData.liverFunction || existingClinicalReport.selectedReport.liverFunction,
            labRemarks: labData.labRemarks || existingClinicalReport.selectedReport.labRemarks,
            // Update timestamp to reflect lab completion
            timeStamp: labData.timeStamp
          };

          await existingClinicalReport.save();
          console.log("Clinical report updated successfully with complete lab data for F-series:", labData.labNumber);
        } else {
          console.log("No existing clinical report found for F-series lab number:", labData.labNumber);
          console.log("This might be expected if clinical assessment hasn't been completed yet.");
        }
      } catch (clinicalError) {
        console.error("Error updating clinical report for F-series:", clinicalError);
        // Don't fail the lab report creation if clinical update fails
      }
    }

    res.status(201).json({
      success: true,
      data: savedLab,
    });
  } catch (error) {
    console.error("Error creating lab report:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getLabReports = async (req, res) => {
  try {
    const labReports = await Lab.find().sort({ timeStamp: -1 });
    res.status(200).json({
      success: true,
      data: labReports,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getLabReportsByPatient = async (req, res) => {
  try {
    const labReports = await Lab.find({ patientId: req.params.patientId })
      .sort({ timeStamp: -1 });

    res.status(200).json({
      success: true,
      data: labReports,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getLabReportById = async (req, res) => {
  try {
    const labReport = await Lab.findById(req.params.id);

    if (!labReport) {
      return res.status(404).json({
        success: false,
        error: 'Lab report not found',
      });
    }

    res.status(200).json({
      success: true,
      data: labReport,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.updateLabReport = async (req, res) => {
  try {
    const labReport = await Lab.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!labReport) {
      return res.status(404).json({
        success: false,
        error: 'Lab report not found',
      });
    }

    res.status(200).json({
      success: true,
      data: labReport,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

exports.deleteLabReport = async (req, res) => {
  try {
    const labReport = await Lab.findByIdAndDelete(req.params.id);

    if (!labReport) {
      return res.status(404).json({
        success: false,
        error: 'Lab report not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
