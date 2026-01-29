const Queue = require('../models/Queue');

// Average service time per student (in minutes)
const AVERAGE_SERVICE_TIME = 15;

// Calculate estimated wait time based on position
const calculateWaitTime = (position) => {
    return position * AVERAGE_SERVICE_TIME;
};

// Join queue - POST /api/queue
const joinQueue = async (req, res) => {
    try {
        const { studentName, serviceType, contactNumber } = req.body;

        // Get count of people currently waiting for this service
        const currentQueueCount = await Queue.countDocuments({
            serviceType: serviceType,
            status: 'Waiting',
        });

        // Position is count + 1
        const position = currentQueueCount + 1;

        // Calculate estimated wait time
        const estimatedWaitTime = calculateWaitTime(position);

        // Create queue entry
        const queueEntry = new Queue({
            studentName,
            serviceType,
            contactNumber,
            position,
            estimatedWaitTime,
        });

        await queueEntry.save();

        res.status(201).json({
            message: 'Successfully joined the queue',
            queueEntry,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all queue entries - GET /api/queue
const getAllQueueEntries = async (req, res) => {
    try {
        const { serviceType, status } = req.query;

        let filter = {};
        if (serviceType) filter.serviceType = serviceType;
        if (status) filter.status = status;

        const queueEntries = await Queue.find(filter).sort({ position: 1 });

        res.json(queueEntries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get queue entry by ID - GET /api/queue/:id
const getQueueEntryById = async (req, res) => {
    try {
        const queueEntry = await Queue.findById(req.params.id);

        if (!queueEntry) {
            return res.status(404).json({ error: 'Queue entry not found' });
        }

        res.json(queueEntry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update queue entry status - PUT /api/queue/:id
const updateQueueEntry = async (req, res) => {
    try {
        const { status } = req.body;

        const queueEntry = await Queue.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true },
        );

        if (!queueEntry) {
            return res.status(404).json({ error: 'Queue entry not found' });
        }

        // If status changed to Completed or Cancelled, update positions
        if (status === 'Completed' || status === 'Cancelled') {
            await updateQueuePositions(queueEntry.serviceType);
        }

        res.json(queueEntry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete queue entry (leave queue) - DELETE /api/queue/:id
const deleteQueueEntry = async (req, res) => {
    try {
        const queueEntry = await Queue.findByIdAndDelete(req.params.id);

        if (!queueEntry) {
            return res.status(404).json({ error: 'Queue entry not found' });
        }

        // Update positions for remaining people
        await updateQueuePositions(queueEntry.serviceType);

        res.json({
            message: 'Successfully left the queue',
            queueEntry,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update positions and wait times after someone leaves
const updateQueuePositions = async (serviceType) => {
    try {
        // Get all waiting entries for this service, sorted by join time
        const waitingEntries = await Queue.find({
            serviceType: serviceType,
            status: 'Waiting',
        }).sort({ joinedAt: 1 });

        // Update positions and wait times
        for (let i = 0; i < waitingEntries.length; i++) {
            const newPosition = i + 1;
            const newWaitTime = calculateWaitTime(newPosition);

            await Queue.findByIdAndUpdate(waitingEntries[i]._id, {
                position: newPosition,
                estimatedWaitTime: newWaitTime,
            });
        }
    } catch (err) {
        console.error('Error updating queue positions:', err);
    }
};

// Get wait time for a specific queue entry - GET /api/queue/:id/waittime
const getWaitTime = async (req, res) => {
    try {
        const queueEntry = await Queue.findById(req.params.id);

        if (!queueEntry) {
            return res.status(404).json({ error: 'Queue entry not found' });
        }

        // NEW: Calculate actual remaining time
        const remainingWait = recalculateWaitTime(queueEntry);

        res.json({
            position: queueEntry.position,
            estimatedWaitTime: remainingWait,
            originalWaitTime: queueEntry.estimatedWaitTime,
            status: queueEntry.status,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const recalculateWaitTime = (queueEntry) => {
    const joinedAt = new Date(queueEntry.joinedAt);
    const now = new Date();
    const elapsedMinutes = Math.floor((now - joinedAt) / 60000);

    // Original wait time minus elapsed time
    const remainingWait = Math.max(
        0,
        queueEntry.estimatedWaitTime - elapsedMinutes,
    );

    return remainingWait;
};

module.exports = {
    joinQueue,
    getAllQueueEntries,
    getQueueEntryById,
    updateQueueEntry,
    deleteQueueEntry,
    getWaitTime,
};
