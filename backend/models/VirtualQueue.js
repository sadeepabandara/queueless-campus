const mongoose = require('mongoose');

const VirtualQueueSchema = new mongoose.Schema(
    {
        appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
        studentName: { type: String, required: true },
        queueNumber: { type: Number, required: true },
        status: { type: String, default: 'Waiting' }, // Waiting, Called, Completed
        estimatedWaitTime: { type: Number, default: 15 }, // in minutes
    },
    { timestamps: true }
);

module.exports = mongoose.model('VirtualQueue', VirtualQueueSchema);
