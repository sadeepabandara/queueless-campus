const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
    {
        studentName: { type: String, required: true },
        serviceType: { type: String, required: true },
        appointmentDate: { type: String, required: true },
        appointmentTime: { type: String, required: true },
        status: { type: String, default: 'Booked' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Appointment', AppointmentSchema);
