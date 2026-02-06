// tests/appointment.test.js - Unit tests for appointment functionality

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const appointmentRoutes = require('../routes/appointments');
const { cleanupDatabase, createTestAppointment } = require('./setup');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/appointments', appointmentRoutes);

describe('Appointment Controller - Unit Tests', () => {
    // Clean database before each test
    beforeEach(async () => {
        await cleanupDatabase();
    });

    describe('POST /api/appointments - Create Appointment', () => {
        test('should create a new appointment with valid data', async () => {
            const appointmentData = createTestAppointment();

            const response = await request(app)
                .post('/api/appointments')
                .send(appointmentData)
                .expect(201);

            expect(response.body).toHaveProperty('_id');
            expect(response.body.studentName).toBe(appointmentData.studentName);
            expect(response.body.serviceType).toBe(appointmentData.serviceType);
            expect(response.body.status).toBe('Booked');
        });

        test('should fail without required fields', async () => {
            const invalidData = {
                studentName: 'Test Student',
                // Missing required fields
            };

            const response = await request(app)
                .post('/api/appointments')
                .send(invalidData)
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });

        test('should set default status to "Booked"', async () => {
            const appointmentData = createTestAppointment();
            delete appointmentData.status; // Remove status

            const response = await request(app)
                .post('/api/appointments')
                .send(appointmentData)
                .expect(201);

            expect(response.body.status).toBe('Booked');
        });
    });

    describe('GET /api/appointments - Get All Appointments', () => {
        test('should return empty array when no appointments exist', async () => {
            const response = await request(app)
                .get('/api/appointments')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        test('should return all appointments', async () => {
            // Create test appointments
            await Appointment.create(createTestAppointment());
            await Appointment.create({
                ...createTestAppointment(),
                studentName: 'Another Student',
            });

            const response = await request(app)
                .get('/api/appointments')
                .expect(200);

            expect(response.body.length).toBe(2);
        });

        test('should sort appointments by date and time', async () => {
            // Create appointments with different dates
            await Appointment.create({
                ...createTestAppointment(),
                appointmentDate: '2025-02-20',
                appointmentTime: '14:00',
            });
            await Appointment.create({
                ...createTestAppointment(),
                appointmentDate: '2025-02-15',
                appointmentTime: '10:00',
            });

            const response = await request(app)
                .get('/api/appointments')
                .expect(200);

            // First appointment should be the earlier date
            expect(response.body[0].appointmentDate).toBe('2025-02-15');
        });
    });

    describe('GET /api/appointments/:id - Get Appointment by ID', () => {
        test('should return appointment by valid ID', async () => {
            const appointment = await Appointment.create(
                createTestAppointment(),
            );

            const response = await request(app)
                .get(`/api/appointments/${appointment._id}`)
                .expect(200);

            expect(response.body._id).toBe(appointment._id.toString());
            expect(response.body.studentName).toBe(appointment.studentName);
        });

        test('should return 404 for non-existent ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/appointments/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBe('Appointment not found');
        });
    });

    describe('PUT /api/appointments/:id - Update Appointment', () => {
        test('should update appointment status', async () => {
            const appointment = await Appointment.create(
                createTestAppointment(),
            );

            const response = await request(app)
                .put(`/api/appointments/${appointment._id}`)
                .send({ status: 'Confirmed' })
                .expect(200);

            expect(response.body.status).toBe('Confirmed');
        });

        test('should update multiple fields', async () => {
            const appointment = await Appointment.create(
                createTestAppointment(),
            );

            const updates = {
                status: 'Completed',
                notes: 'Updated notes',
            };

            const response = await request(app)
                .put(`/api/appointments/${appointment._id}`)
                .send(updates)
                .expect(200);

            expect(response.body.status).toBe('Completed');
            expect(response.body.notes).toBe('Updated notes');
        });

        test('should return 404 for non-existent ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .put(`/api/appointments/${fakeId}`)
                .send({ status: 'Confirmed' })
                .expect(404);

            expect(response.body.error).toBe('Appointment not found');
        });
    });

    describe('DELETE /api/appointments/:id - Delete Appointment', () => {
        test('should delete appointment by ID', async () => {
            const appointment = await Appointment.create(
                createTestAppointment(),
            );

            const response = await request(app)
                .delete(`/api/appointments/${appointment._id}`)
                .expect(200);

            expect(response.body.message).toBe(
                'Appointment deleted successfully',
            );

            // Verify it's actually deleted
            const found = await Appointment.findById(appointment._id);
            expect(found).toBeNull();
        });

        test('should return 404 for non-existent ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .delete(`/api/appointments/${fakeId}`)
                .expect(404);

            expect(response.body.error).toBe('Appointment not found');
        });
    });

    // Clean database after each test
    afterAll(async () => {
        await cleanupDatabase();
    });
});
