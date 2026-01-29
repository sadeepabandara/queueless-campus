const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema(
    {
        studentName: {
            type: String,
            required: true,
        },
        serviceType: {
            type: String,
            required: true,
        },
        contactNumber: {
            type: String,
            required: true,
        },
        position: {
            type: Number,
            required: true,
        },
        estimatedWaitTime: {
            type: Number, // in minutes
            default: 0,
        },
        status: {
            type: String,
            enum: ['Waiting', 'In Progress', 'Completed', 'Cancelled'],
            default: 'Waiting',
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('Queue', QueueSchema);
