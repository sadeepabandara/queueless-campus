const express = require('express');
const router = express.Router();
const {
    joinQueue,
    getAllQueueEntries,
    getQueueEntryById,
    updateQueueEntry,
    deleteQueueEntry,
    getWaitTime,
} = require('../controllers/queueController');

// Join queue - POST /api/queue
router.post('/', joinQueue);

// Get all queue entries (can filter by serviceType or status) - GET /api/queue
router.get('/', getAllQueueEntries);

// Get queue entry by ID - GET /api/queue/:id
router.get('/:id', getQueueEntryById);

// Get current wait time for queue entry - GET /api/queue/:id/waittime
router.get('/:id/waittime', getWaitTime);

// Update queue entry status - PUT /api/queue/:id
router.put('/:id', updateQueueEntry);

// Leave queue (delete entry) - DELETE /api/queue/:id
router.delete('/:id', deleteQueueEntry);

module.exports = router;
