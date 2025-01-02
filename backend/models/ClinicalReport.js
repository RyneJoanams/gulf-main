const mongoose = require('mongoose');

const ClinicalReportSchema = new mongoose.Schema({
    patientName: { type: String, required: true },
    labNumber: { type: Number, required: true },
    clinicalRemarks: { type: String },
    timestamp: { type: Date, default: Date.now },
    labRemarks: { type: String },
    urineTest: { type: String },
    bloodTest: { type: String },
    generalExamination: {
        hernia: String,
        varicoseVein: String,
        rightEye: String,
        leftEye: String,
    },
    systemicExamination: {
        heart: String,
        bloodPressure: String,
        pulseRate: String,
    },
    otherTests: {
        hydrocele: String,
        earRight: String,
        earLeft: String,
        lungs: String,
        liver: String,
        spleen: String,
        otherDeformities: String,
    },
    renalFunction: { type: String },
    fullHaemogram: { type: String },
    liverFunction: { type: String },
    clinicalNotes: { type: String },
    clinicalOfficerName: { type: String, required: true },
    height: { type: Number },
    weight: { type: Number }
});

module.exports = mongoose.model('ClinicalReport', ClinicalReportSchema);
