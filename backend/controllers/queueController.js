const VirtualQueue = require('../models/VirtualQueue');
const Appointment = require('../models/Appointment');

// Join virtual queue - POST /api/queue/join
const joinQueue = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        
        // Get the appointment
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Get the last queue number
        const lastEntry = await VirtualQueue.findOne().sort({ queueNumber: -1 });
        const nextQueueNumber = lastEntry ? lastEntry.queueNumber + 1 : 1;

        // Calculate estimated wait time (15 min per person ahead)
        const waitingCount = await VirtualQueue.countDocuments({ status: 'Waiting' });
        const estimatedWaitTime = waitingCount * 15;

        const queueEntry = new VirtualQueue({
            appointmentId,
            studentName: appointment.studentName,
            queueNumber: nextQueueNumber,
            estimatedWaitTime
        });

        await queueEntry.save();
        res.status(201).json(queueEntry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get queue status - GET /api/queue/status/:appointmentId
const getQueueStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        
        const queueEntries = await VirtualQueue.find({ 
            appointmentId,
            status: { $ne: 'Completed' }
        }).sort({ queueNumber: 1 });

        res.json(queueEntries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get user's queue position - GET /api/queue/my-position/:appointmentId
const getMyPosition = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { studentName } = req.query;

        const entry = await VirtualQueue.findOne({ appointmentId, studentName });
        if (!entry) {
            return res.status(404).json({ error: 'Not in queue' });
        }

        const waitingAhead = await VirtualQueue.countDocuments({
            appointmentId,
            queueNumber: { $lt: entry.queueNumber },
            status: 'Waiting'
        });

        res.json({
            ...entry.toObject(),
            waitingAhead,
            estimatedWaitTime: waitingAhead * 15
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update queue entry status - PUT /api/queue/update/:id
const updateQueueStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const entry = await VirtualQueue.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ error: 'Queue entry not found' });
        }

        res.json(entry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all queue entries (for staff) - GET /api/queue/all
const getAllQueueEntries = async (req, res) => {
    try {
        const queueEntries = await VirtualQueue.find().sort({ queueNumber: 1 });
        res.json(queueEntries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    joinQueue,
    getQueueStatus,
    getMyPosition,
    updateQueueStatus,
    getAllQueueEntries
};
