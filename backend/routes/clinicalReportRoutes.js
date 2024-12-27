const express = require('express');
const router = express.Router();
const clinicalReportController = require('../controllers/clinicalReportController');

router.get('/', clinicalReportController.getAllReports);
router.post('/', clinicalReportController.createReport);
router.get('/:id', clinicalReportController.getReportById);
router.put('/:id', clinicalReportController.updateReport);
router.delete('/:id', clinicalReportController.deleteReport);

module.exports = router;
