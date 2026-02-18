const express = require('express');
const patientController = require('../controllers/patientController');
const patientAccount = require('../controllers/patientAccount')
const { upload } = require('../config/cloudinary'); // Use Cloudinary upload

const patientRoutes = express.Router();

//Patient Registration Routes
patientRoutes.get('/', patientController.getAllPatients);
patientRoutes.get('/pending-payment', patientController.getPatientsPendingPayment);
patientRoutes.get('/without-lab-numbers', patientController.getPatientsWithoutLabNumbers);
patientRoutes.get('/:id', patientController.getPatientById);
patientRoutes.post('/', upload.single('photo'), patientController.createPatient); // File upload for patient photo
patientRoutes.put('/:id', upload.single('photo'), patientController.updatePatient); // Support photo upload in updates
patientRoutes.put('/mark-payment-recorded', patientController.markPaymentRecorded);
patientRoutes.delete('/:id', patientController.deletePatient);

//Patient Account Routes
patientRoutes.get('/account/:id', patientAccount.getPaymentRecords);
patientRoutes.post('/account', patientAccount.createPayment);
patientRoutes.put('/account/:id', patientAccount.updatePayment);
patientRoutes.delete('/account/:id', patientAccount.deletePayment);

module.exports = patientRoutes;
