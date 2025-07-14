const mongoose = require("mongoose");

const clinicalSchema = new mongoose.Schema(
  {
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
      fullHaemogram: {
        wbc: {
          value: String,
          units: String,
          status: String,
          range: String,
        },
        rbc: {
          value: String,
          units: String,
          status: String,
          range: String,
        },
        // ... other haemogram fields
      },
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Clinical", clinicalSchema);
