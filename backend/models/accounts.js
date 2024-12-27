const mongoose = require('mongoose');

const accountsSchema = new mongoose.Schema({
    patientName: { type: String, required: true },
    modeOfPayment: { type: String, required: true }, // Moved field
    accountNumber: { type: String, required: true, unique: true },
    amountPaid: { type: Number, required: true }, // Moved field
    commission: { type: Number, required: true }, // Moved field
    xrayPayment: { type: Number, required: true }, // Moved field
    amountDue: { type: Number, required: true }, // Moved field
    paymentStatus: { type: String, enum: ['Paid', 'Pending'], required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
});

module.exports = mongoose.model('accounts', accountsSchema);
