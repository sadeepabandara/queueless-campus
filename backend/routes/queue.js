const express = require('express');
const router = express.Router();
const {
    joinQueue,
    getQueueStatus,
    getMyPosition,
    updateQueueStatus,
    getAllQueueEntries
} = require('../controllers/queueController');

// Join virtual queue
router.post('/join', joinQueue);

// Get queue status for an appointment
router.get('/status/:appointmentId', getQueueStatus);

// Get user's position in queue
router.get('/my-position/:appointmentId', getMyPosition);

// Update queue entry status (for staff)
router.put('/update/:id', updateQueueStatus);

// Get all queue entries (for staff)
router.get('/all', getAllQueueEntries);

module.exports = router;
