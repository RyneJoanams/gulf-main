const mongoose = require('mongoose');

const ClinicalReportSchema = new mongoose.Schema({
    patientName: { type: String, required: true },
    labNumber: { type: Number, required: true },
    clinicalRemarks: { type: String },
    timestamp: { type: Date, default: Date.now },
    labRemarks: { type: String },
    urineTest: { type: String },
    bloodTest: { type: String },
    generalExamination: { type: String },
    systemicExamination: { type: String },
    area1: { type: String },
    renalFunction: { type: String },
    fullHaemogram: { type: String },
    liverFunction: { type: String },
    clinicalNotes: { type: String },
    clinicalOfficerName: { type: String, required: true },
    height: { type: Number },
    weight: { type: Number }
});

module.exports = mongoose.model('ClinicalReport', ClinicalReportSchema);
