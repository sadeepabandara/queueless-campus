const express = require('express');
const router = express.Router();
const {
    createAppointment,
    getAllAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
} = require('../controllers/appointmentController');

// Create new appointment - POST /api/appointments
router.post('/', createAppointment);

// Get all appointments - GET /api/appointments
router.get('/', getAllAppointments);

// Get single appointment - GET /api/appointments/:id
router.get('/:id', getAppointmentById);

// Update appointment - PUT /api/appointments/:id
router.put('/:id', updateAppointment);

// Delete appointment - DELETE /api/appointments/:id
router.delete('/:id', deleteAppointment);

module.exports = router;
