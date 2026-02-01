// tests/queue.test.js - Unit tests for queue functionality

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const queueRoutes = require('../routes/queue');
const { cleanupDatabase, createTestQueueEntry } = require('./setup');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/queue', queueRoutes);

describe('Queue Controller - Unit Tests', () => {
    // Clean database before each test
    beforeEach(async () => {
        await cleanupDatabase();
    });

    describe('POST /api/queue - Join Queue', () => {
        test('should add user to queue with position 1', async () => {
            const queueData = createTestQueueEntry();

            const response = await request(app)
                .post('/api/queue')
                .send(queueData)
                .expect(201);

            expect(response.body.queueEntry).toHaveProperty('_id');
            expect(response.body.queueEntry.studentName).toBe(
                queueData.studentName,
            );
            expect(response.body.queueEntry.position).toBe(1);
            expect(response.body.queueEntry.estimatedWaitTime).toBe(15); // 1 * 15 minutes
        });

        test('should assign correct position for multiple entries', async () => {
            const queueData = createTestQueueEntry();

            // Add first person
            await request(app).post('/api/queue').send(queueData);

            // Add second person
            const response = await request(app)
                .post('/api/queue')
                .send({
                    ...queueData,
                    studentName: 'Second Student',
                })
                .expect(201);

            expect(response.body.queueEntry.position).toBe(2);
            expect(response.body.queueEntry.estimatedWaitTime).toBe(30); // 2 * 15 minutes
        });

        test('should calculate wait time correctly (position * 15 minutes)', async () => {
            const queueData = createTestQueueEntry();

            // Add 3 people
            await request(app).post('/api/queue').send(queueData);
            await request(app)
                .post('/api/queue')
                .send({ ...queueData, studentName: 'Person 2' });

            const response = await request(app)
                .post('/api/queue')
                .send({ ...queueData, studentName: 'Person 3' })
                .expect(201);

            expect(response.body.queueEntry.position).toBe(3);
            expect(response.body.queueEntry.estimatedWaitTime).toBe(45); // 3 * 15
        });

        test('should set default status to "Waiting"', async () => {
            const queueData = createTestQueueEntry();

            const response = await request(app)
                .post('/api/queue')
                .send(queueData)
                .expect(201);

            expect(response.body.queueEntry.status).toBe('Waiting');
        });

        test('should fail without required fields', async () => {
            const invalidData = {
                studentName: 'Test Student',
                // Missing serviceType and contactNumber
            };

            const response = await request(app)
                .post('/api/queue')
                .send(invalidData)
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/queue - Get All Queue Entries', () => {
        test('should return empty array when queue is empty', async () => {
            const response = await request(app).get('/api/queue').expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        test('should return all queue entries', async () => {
            const queueData = createTestQueueEntry();

            await request(app).post('/api/queue').send(queueData);
            await request(app)
                .post('/api/queue')
                .send({ ...queueData, studentName: 'Another Student' });

            const response = await request(app).get('/api/queue').expect(200);

            expect(response.body.length).toBe(2);
        });

        test('should filter by service type', async () => {
            const queueData = createTestQueueEntry();

            await request(app).post('/api/queue').send(queueData); // IT Support
            await request(app)
                .post('/api/queue')
                .send({
                    ...queueData,
                    serviceType: 'Student Services',
                    studentName: 'Another Student',
                });

            const response = await request(app)
                .get('/api/queue?serviceType=IT Support')
                .expect(200);

            expect(response.body.length).toBe(1);
            expect(response.body[0].serviceType).toBe('IT Support');
        });

        test('should filter by status', async () => {
            const queueData = createTestQueueEntry();

            // Create queue entry
            const created = await request(app)
                .post('/api/queue')
                .send(queueData);

            // Update status to "In Progress"
            await request(app)
                .put(`/api/queue/${created.body.queueEntry._id}`)
                .send({ status: 'In Progress' });

            const response = await request(app)
                .get('/api/queue?status=In Progress')
                .expect(200);

            expect(response.body.length).toBe(1);
            expect(response.body[0].status).toBe('In Progress');
        });
    });

    describe('GET /api/queue/:id - Get Queue Entry by ID', () => {
        test('should return queue entry by valid ID', async () => {
            const queueData = createTestQueueEntry();
            const created = await request(app)
                .post('/api/queue')
                .send(queueData);

            const response = await request(app)
                .get(`/api/queue/${created.body.queueEntry._id}`)
                .expect(200);

            expect(response.body._id).toBe(created.body.queueEntry._id);
            expect(response.body.studentName).toBe(queueData.studentName);
        });

        test('should return 404 for non-existent ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/queue/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBe('Queue entry not found');
        });
    });

    describe('GET /api/queue/:id/waittime - Get Wait Time', () => {
        test('should return current wait time for queue entry', async () => {
            const queueData = createTestQueueEntry();
            const created = await request(app)
                .post('/api/queue')
                .send(queueData);

            const response = await request(app)
                .get(`/api/queue/${created.body.queueEntry._id}/waittime`)
                .expect(200);

            expect(response.body).toHaveProperty('position');
            expect(response.body).toHaveProperty('estimatedWaitTime');
            expect(response.body.position).toBe(1);
        });

        test('should return 404 for non-existent ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/queue/${fakeId}/waittime`)
                .expect(404);

            expect(response.body.error).toBe('Queue entry not found');
        });
    });

    describe('PUT /api/queue/:id - Update Queue Entry', () => {
        test('should update queue entry status', async () => {
            const queueData = createTestQueueEntry();
            const created = await request(app)
                .post('/api/queue')
                .send(queueData);

            const response = await request(app)
                .put(`/api/queue/${created.body.queueEntry._id}`)
                .send({ status: 'In Progress' })
                .expect(200);

            expect(response.body.status).toBe('In Progress');
        });

        test('should return 404 for non-existent ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .put(`/api/queue/${fakeId}`)
                .send({ status: 'Completed' })
                .expect(404);

            expect(response.body.error).toBe('Queue entry not found');
        });
    });

    describe('DELETE /api/queue/:id - Leave Queue', () => {
        test('should remove entry from queue', async () => {
            const queueData = createTestQueueEntry();
            const created = await request(app)
                .post('/api/queue')
                .send(queueData);

            const response = await request(app)
                .delete(`/api/queue/${created.body.queueEntry._id}`)
                .expect(200);

            expect(response.body.message).toBe('Successfully left the queue');

            // Verify it's deleted
            const found = await Queue.findById(created.body.queueEntry._id);
            expect(found).toBeNull();
        });

        test('should update positions after someone leaves', async () => {
            const queueData = createTestQueueEntry();

            // Add 3 people
            const person1 = await request(app)
                .post('/api/queue')
                .send(queueData);
            await request(app)
                .post('/api/queue')
                .send({ ...queueData, studentName: 'Person 2' });
            const person3 = await request(app)
                .post('/api/queue')
                .send({ ...queueData, studentName: 'Person 3' });

            // Person 1 leaves
            await request(app).delete(
                `/api/queue/${person1.body.queueEntry._id}`,
            );

            // Check person 3's new position
            const updated = await request(app).get(
                `/api/queue/${person3.body.queueEntry._id}`,
            );

            expect(updated.body.position).toBe(2); // Should be updated from 3 to 2
        });

        test('should return 404 for non-existent ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .delete(`/api/queue/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBe('Queue entry not found');
        });
    });
});
