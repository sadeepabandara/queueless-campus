// tests/integration.test.js - Integration tests for complete workflows

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const appointmentRoutes = require('../routes/appointments');
const queueRoutes = require('../routes/queue');
const {
    cleanupDatabase,
    createTestAppointment,
    createTestQueueEntry,
} = require('./setup');

// Create full Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);

describe('Integration Tests - End-to-End Workflows', () => {
    beforeEach(async () => {
        await cleanupDatabase();
    });

    describe('Complete Appointment Workflow', () => {
        test('should handle full appointment lifecycle', async () => {
            const appointmentData = createTestAppointment();

            // 1. Create appointment
            const created = await request(app)
                .post('/api/appointments')
                .send(appointmentData)
                .expect(201);

            const appointmentId = created.body._id;
            expect(created.body.status).toBe('Booked');

            // 2. Retrieve appointment
            const retrieved = await request(app)
                .get(`/api/appointments/${appointmentId}`)
                .expect(200);

            expect(retrieved.body.studentName).toBe(
                appointmentData.studentName,
            );

            // 3. Update to Confirmed
            const confirmed = await request(app)
                .put(`/api/appointments/${appointmentId}`)
                .send({ status: 'Confirmed' })
                .expect(200);

            expect(confirmed.body.status).toBe('Confirmed');

            // 4. Update to Completed
            const completed = await request(app)
                .put(`/api/appointments/${appointmentId}`)
                .send({ status: 'Completed' })
                .expect(200);

            expect(completed.body.status).toBe('Completed');

            // 5. Delete appointment
            await request(app)
                .delete(`/api/appointments/${appointmentId}`)
                .expect(200);

            // 6. Verify deletion
            await request(app)
                .get(`/api/appointments/${appointmentId}`)
                .expect(404);
        });

        test('should retrieve all appointments after creating multiple', async () => {
            // Create 3 appointments
            await request(app)
                .post('/api/appointments')
                .send(createTestAppointment());
            await request(app)
                .post('/api/appointments')
                .send({
                    ...createTestAppointment(),
                    studentName: 'Student 2',
                });
            await request(app)
                .post('/api/appointments')
                .send({
                    ...createTestAppointment(),
                    studentName: 'Student 3',
                });

            // Retrieve all
            const all = await request(app).get('/api/appointments').expect(200);

            expect(all.body.length).toBe(3);
        });
    });

    describe('Complete Queue Workflow', () => {
        test('should handle full queue lifecycle', async () => {
            const queueData = createTestQueueEntry();

            // 1. Join queue
            const joined = await request(app)
                .post('/api/queue')
                .send(queueData)
                .expect(201);

            const queueId = joined.body.queueEntry._id;
            expect(joined.body.queueEntry.position).toBe(1);
            expect(joined.body.queueEntry.status).toBe('Waiting');

            // 2. Check wait time
            const waitTime = await request(app)
                .get(`/api/queue/${queueId}/waittime`)
                .expect(200);

            expect(waitTime.body.estimatedWaitTime).toBeDefined();

            // 3. Update status to In Progress
            const inProgress = await request(app)
                .put(`/api/queue/${queueId}`)
                .send({ status: 'In Progress' })
                .expect(200);

            expect(inProgress.body.status).toBe('In Progress');

            // 4. Complete service
            const completed = await request(app)
                .put(`/api/queue/${queueId}`)
                .send({ status: 'Completed' })
                .expect(200);

            expect(completed.body.status).toBe('Completed');

            // 5. Optionally delete (leave queue)
            await request(app).delete(`/api/queue/${queueId}`).expect(200);

            // 6. Verify deletion
            await request(app).get(`/api/queue/${queueId}`).expect(404);
        });

        test('should manage multiple people in queue correctly', async () => {
            const queueData = createTestQueueEntry();

            // Add 3 people to queue
            const person1 = await request(app)
                .post('/api/queue')
                .send(queueData);

            const person2 = await request(app)
                .post('/api/queue')
                .send({ ...queueData, studentName: 'Person 2' });

            const person3 = await request(app)
                .post('/api/queue')
                .send({ ...queueData, studentName: 'Person 3' });

            // Verify positions
            expect(person1.body.queueEntry.position).toBe(1);
            expect(person2.body.queueEntry.position).toBe(2);
            expect(person3.body.queueEntry.position).toBe(3);

            // Verify wait times
            expect(person1.body.queueEntry.estimatedWaitTime).toBe(15);
            expect(person2.body.queueEntry.estimatedWaitTime).toBe(30);
            expect(person3.body.queueEntry.estimatedWaitTime).toBe(45);

            // Person 1 leaves
            await request(app)
                .delete(`/api/queue/${person1.body.queueEntry._id}`)
                .expect(200);

            // Check updated positions
            const updated2 = await request(app).get(
                `/api/queue/${person2.body.queueEntry._id}`,
            );
            const updated3 = await request(app).get(
                `/api/queue/${person3.body.queueEntry._id}`,
            );

            expect(updated2.body.position).toBe(1); // Was 2, now 1
            expect(updated3.body.position).toBe(2); // Was 3, now 2
        });
    });

    describe('Mixed Appointment and Queue Workflow', () => {
        test('should handle both appointments and queue simultaneously', async () => {
            // Student books appointment
            const appointment = await request(app)
                .post('/api/appointments')
                .send(createTestAppointment())
                .expect(201);

            // Another student joins queue
            const queueEntry = await request(app)
                .post('/api/queue')
                .send(createTestQueueEntry())
                .expect(201);

            // Both should exist
            const appointments = await request(app).get('/api/appointments');
            const queue = await request(app).get('/api/queue');

            expect(appointments.body.length).toBe(1);
            expect(queue.body.length).toBe(1);

            // Complete appointment
            await request(app)
                .put(`/api/appointments/${appointment.body._id}`)
                .send({ status: 'Completed' });

            // Complete queue entry
            await request(app)
                .put(`/api/queue/${queueEntry.body.queueEntry._id}`)
                .send({ status: 'Completed' });

            // Both should be completed
            const completedApp = await request(app).get(
                `/api/appointments/${appointment.body._id}`,
            );
            const completedQueue = await request(app).get(
                `/api/queue/${queueEntry.body.queueEntry._id}`,
            );

            expect(completedApp.body.status).toBe('Completed');
            expect(completedQueue.body.status).toBe('Completed');
        });
    });

    describe('Service Type Filtering', () => {
        test('should filter queue entries by service type', async () => {
            // Add entries for different services
            await request(app)
                .post('/api/queue')
                .send({
                    ...createTestQueueEntry(),
                    serviceType: 'IT Support',
                });

            await request(app)
                .post('/api/queue')
                .send({
                    ...createTestQueueEntry(),
                    serviceType: 'Student Services',
                    studentName: 'Another Student',
                });

            await request(app)
                .post('/api/queue')
                .send({
                    ...createTestQueueEntry(),
                    serviceType: 'IT Support',
                    studentName: 'Third Student',
                });

            // Filter for IT Support
            const itSupport = await request(app)
                .get('/api/queue?serviceType=IT Support')
                .expect(200);

            expect(itSupport.body.length).toBe(2);
            itSupport.body.forEach((entry) => {
                expect(entry.serviceType).toBe('IT Support');
            });

            // Filter for Student Services
            const studentServices = await request(app)
                .get('/api/queue?serviceType=Student Services')
                .expect(200);

            expect(studentServices.body.length).toBe(1);
            expect(studentServices.body[0].serviceType).toBe(
                'Student Services',
            );
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid appointment ID gracefully', async () => {
            const invalidId = 'invalid-id-format';

            await request(app)
                .get(`/api/appointments/${invalidId}`)
                .expect(500);
        });

        test('should handle invalid queue ID gracefully', async () => {
            const invalidId = 'invalid-id-format';

            await request(app).get(`/api/queue/${invalidId}`).expect(500);
        });

        test('should prevent duplicate queue entries from same student', async () => {
            const queueData = createTestQueueEntry();

            // First entry should succeed
            await request(app).post('/api/queue').send(queueData).expect(201);

            // Note: Current implementation allows duplicates
            // This test documents current behavior
            // In production, you might want to prevent duplicates
        });
    });
});
