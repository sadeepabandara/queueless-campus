const express = require('express');
const Appointment = require('../models/Appointment');
const router = express.Router();

// Create appointment
router.post('/', async (req, res) => {
    try {
        const appointment = new Appointment(req.body);
        await appointment.save();
        res.status(201).json(appointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all appointments
router.get('/', async (req, res) => {
    try {
        const appointments = await Appointment.find();
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
