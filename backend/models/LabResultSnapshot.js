const mongoose = require('mongoose');

const LabResultSnapshotSchema = new mongoose.Schema({
  labNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  patientName: {
    type: String,
    required: true
  },
  reportData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 90*24*60*60*1000), // 90 days from now
    index: true
  }
}, {
  timestamps: true
});

// Index for automatic deletion of old records
LabResultSnapshotSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const LabResultSnapshot = mongoose.model('LabResultSnapshot', LabResultSnapshotSchema);

module.exports = LabResultSnapshot;
