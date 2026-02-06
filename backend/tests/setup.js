// tests/setup.js - Test setup and utilities

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to test database before all tests
beforeAll(async () => {
    // Use test database or the same database
    // In production, you'd use a separate test database
    const mongoUri =
        process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/queueless-test';

    try {
        await mongoose.connect(mongoUri);
        console.log('✓ Test database connected');
    } catch (error) {
        console.error('✗ Test database connection failed:', error);
        throw error;
    }
});

// Disconnect after all tests
afterAll(async () => {
    await mongoose.connection.close();
    console.log('✓ Test database disconnected');
});

// Export test utilities
module.exports = {
    // Clean up collections after each test
    async cleanupDatabase() {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    },

    // Create test appointment data
    createTestAppointment() {
        return {
            studentName: 'Test Student',
            serviceType: 'Student Services',
            appointmentDate: '2025-02-15',
            appointmentTime: '10:00',
            notes: 'Test appointment',
            status: 'Booked',
        };
    },

    // Create test queue entry data
    createTestQueueEntry() {
        return {
            studentName: 'Test Student',
            serviceType: 'IT Support',
            contactNumber: '0412345678',
        };
    },
};
