const ClinicalReport = require('../models/ClinicalReport');

exports.getAllReports = async (req, res) => {
    try {
        const reports = await ClinicalReport.find();
        res.status(200).json({ data: reports });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching clinical reports', error });
    }
};

exports.createReport = async (req, res) => {
    try {
        const newReport = new ClinicalReport({
            ...req.body,
            clinicalNotes: req.body.clinicalNotes,
            clinicalOfficerName: req.body.clinicalOfficerName,
            height: req.body.height,
            weight: req.body.weight,
            generalExamination: req.body.generalExamination,
            systemicExamination: req.body.systemicExamination,
            otherTests: req.body.otherTests
        });
        const savedReport = await newReport.save();
        res.status(201).json({ data: savedReport });
    } catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json({ message: 'Validation Error', error: error.message });
        } else {
            res.status(500).json({ message: 'Error creating clinical report', error });
        }
    }
};

exports.getReportById = async (req, res) => {
    try {
        const report = await ClinicalReport.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.status(200).json({ data: report });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching clinical report', error });
    }
};

exports.updateReport = async (req, res) => {
    try {
        const updatedReport = await ClinicalReport.findByIdAndUpdate(req.params.id, {
            ...req.body,
            clinicalNotes: req.body.clinicalNotes,
            clinicalOfficerName: req.body.clinicalOfficerName,
            height: req.body.height,
            weight: req.body.weight,
            generalExamination: req.body.generalExamination,
            systemicExamination: req.body.systemicExamination,
            otherTests: req.body.otherTests
        }, { new: true });
        if (!updatedReport) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.status(200).json({ data: updatedReport });
    } catch (error) {
        res.status(500).json({ message: 'Error updating clinical report', error });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const deletedReport = await ClinicalReport.findByIdAndDelete(req.params.id);
        if (!deletedReport) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.status(200).json({ message: 'Report deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting clinical report', error });
    }
};
