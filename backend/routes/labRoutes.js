const express = require('express');
const labRoutes = express.Router();
const {
  createLabReport,
  getLabReports,
  getLabReportsByPatient,
  getLabReportById,
  updateLabReport,
  deleteLabReport
} = require('../controllers/labController');
const { createLabNumber, getAllLabNumbers } = require('../controllers/labNumberController');
const { upload } = require('../config/cloudinary'); // Use Cloudinary upload

// Lab report routes
labRoutes.post('/', upload.single('patientImage'), createLabReport);
labRoutes.get('/', getLabReports);
labRoutes.get('/patient/:patientId', getLabReportsByPatient);
labRoutes.get('/:id', getLabReportById);
labRoutes.put('/:id', updateLabReport);
labRoutes.delete('/:id', deleteLabReport);

// Lab number routes
labRoutes.post('/number/generate', createLabNumber);
labRoutes.get('/number/all', getAllLabNumbers);

module.exports = labRoutes;