const mongoose = require('mongoose');

const RadiologyTestSchema = new mongoose.Schema({
    heafMantouxTest: {
        type: String,
        required: true
    },
    chestXRayTest: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('RadiologyTest', RadiologyTestSchema);
