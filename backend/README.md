# QueueLess Campus - Backend

## Overview

This is the backend API server for **QueueLess Campus**, built using Node.js, Express, and MongoDB. The backend handles all business logic, data storage, and communication with the frontend.

It exposes REST APIs for:

- Appointment booking
- Appointment management
- Virtual queue handling
- Wait-time calculation

## Features Implemented

### Sprint 1

- Express server setup
- MongoDB connection (Atlas)
- Appointment model, routes, and controllers
- CRUD for appointments

### Sprint 2

- Queue model, routes, and controllers
- Join queue functionality
- Estimated wait-time calculation
- Integration & automated testing

## Backend Structure

```
backend/
├─ controllers/
│  ├─ appointmentController.js
│  ├─ queueController.js
├─ models/
│  ├─ Appointment.js
│  ├─ Queue.js
├─ routes/
│  ├─ appointments.js
│  ├─ queue.js
├─ tests/
│  ├─ appointment.test.js
│  ├─ queue.test.js
│  ├─ integration.test.js
│  ├─ setup.js
├─ server.js
├─ .env
```

## Installation

1. Open terminal and navigate to the **backend** folder

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the `backend` folder with:

```
PORT=8080
MONGO_URI=<mongodb-connection-string>
```

4. Start the server:

```bash
npm start
```

## API Endpoints

### Appointments

| Method | Endpoint                | Description                 |
| ------ | ----------------------- | --------------------------- |
| GET    | `/api/appointments`     | Get all appointments        |
| POST   | `/api/appointments`     | Create a new appointment    |
| PUT    | `/api/appointments/:id` | Update an appointment by ID |
| DELETE | `/api/appointments/:id` | Delete an appointment by ID |

### Virtual Queue

| Method | Endpoint         | Description                  |
| ------ | ---------------- | ---------------------------- |
| GET    | `/api/queue`     | Get current queue state      |
| POST   | `/api/queue`     | Join the virtual queue       |
| PUT    | `/api/queue/:id` | Update a queue entry by ID   |
| DELETE | `/api/queue/:id` | Remove a user from the queue |

## Testing

Automated tests are implemented using **Jest and Supertest**.

Run tests with:

```bash
npm test
```

This will execute:

- Unit tests (appointment & queue logic)
- Integration tests

## Notes

- This server must be running for the frontend to function.
- All APIs respond with JSON.
- For Sprint 2, real-time wait time is calculated on the backend based on queue position.
