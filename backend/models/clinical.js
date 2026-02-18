const mongoose = require("mongoose");

const clinicalSchema = new mongoose.Schema(
  {
    // Patient basic information
    passportNumber: { type: String },
    gender: { type: String },
    age: { type: Number },
    agent: { type: String }, // Add agent field
    selectedReport: {
      patientName: { type: String, required: true },
      labNumber: { type: String, required: true },
      medicalType: { type: String, default: "N/A" }, // Make sure this field exists
      patientImage: { type: String },
      timeStamp: { type: Date, default: Date.now },
      // Include all other lab test fields that come from the lab report
      area1: {
        bloodGroup: String,
        pregnancyTest: String,
        vdrlTest: String,
      },
      bloodTest: {
        esr: String,
        hbsAg: String,
        hcv: String,
        hivTest: String,
      },
      fullHaemogram: mongoose.Schema.Types.Mixed, // Use Mixed type to support all dynamic test fields
      renalFunction: mongoose.Schema.Types.Mixed, // Add renal function tests
      liverFunction: mongoose.Schema.Types.Mixed, // Add liver function tests
      urineTest: {
        albumin: String,
        sugar: String,
        reaction: String,
        microscopic: String,
      },
      labRemarks: {
        fitnessEvaluation: {
          overallStatus: String,
          otherAspectsFit: String,
        },
        labSuperintendent: {
          name: String,
        },
      },
    },
    generalExamination: {
      leftEye: String,
      rightEye: String,
      hernia: String,
      varicoseVein: String,
    },
    systemicExamination: {
      bloodPressure: String,
      heart: String,
      pulseRate: String,
    },
    otherTests: mongoose.Schema.Types.Mixed,
    clinicalNotes: String,
    clinicalOfficerName: String,
    height: String,
    weight: String,
    historyOfPastIllness: String,
    allergy: String,
    radiologyData: mongoose.Schema.Types.Mixed,
    // Flag to track if this clinical report is from phlebotomy F-series routing
    isFromPhlebotomy: { type: Boolean, default: false },
    // Radiology referral fields
    radiologyReferral: { 
      type: String, 
      enum: ['yes', 'no', ''], 
      default: '' 
    },
    requiresRadiology: { 
      type: Boolean, 
      default: false 
    },
    radiologyStatus: { 
      type: String, 
      enum: ['pending', 'completed', 'not-required'], 
      default: 'not-required' 
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for frequently queried fields to improve performance
clinicalSchema.index({ 'selectedReport.labNumber': 1 });
clinicalSchema.index({ 'selectedReport.patientName': 'text', passportNumber: 'text' });
clinicalSchema.index({ passportNumber: 1 }); // Plain index for regex/equality searches
clinicalSchema.index({ createdAt: -1 });
clinicalSchema.index({ 'selectedReport.timeStamp': -1 });

module.exports = mongoose.model("Clinical", clinicalSchema);
