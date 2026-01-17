const Appointment = require('../models/Appointment');

// Create new appointment - POST /api/appointments
const createAppointment = async (req, res) => {
    try {
        const appointment = new Appointment(req.body);
        await appointment.save();
        res.status(201).json(appointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all appointments - GET /api/appointments
const getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({
            appointmentDate: 1,
            appointmentTime: 1,
        });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get single appointment by ID - GET /api/appointments/:id
const getAppointmentById = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json(appointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update appointment - PUT /api/appointments/:id
const updateAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json(appointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete appointment - DELETE /api/appointments/:id
const deleteAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json({ message: 'Appointment deleted successfully', appointment });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createAppointment,
    getAllAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
};
