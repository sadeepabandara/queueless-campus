# QueueLess Campus - Frontend

## Overview

This is the frontend application for **QueueLess Campus**, a web-based queue and appointment management system designed for university campuses. This interface allows students to book appointments, join virtual queues, and view estimated wait times. Staff members can view daily appointments and queue status.

## Features Implemented (Frontend)

### Sprint 1

- **Homepage** (`index.html`)
- **Appointment Booking Page** (`appointment.html`)
    - Form for student name, service type, date, time
    - Connects to backend API to create appointments
- **Staff Dashboard** (`staff.html`)
    - Displays appointments
    - Supports delete and update operations
- Basic styling with `style.css`

### Sprint 2

- **Virtual Queue Page** (`queue.html`)
    - Shows queue position
    - Displays calculated wait-time dynamically
    - Integrates with real-time queue backend
- Queue interaction logic in `queue.js`

## Frontend Structure

```
frontend/
├─ index.html          # Homepage
├─ appointment.html    # Appointment booking UI
├─ staff.html          # Staff dashboard UI
├─ queue.html          # Virtual queue UI
├─ style.css           # Styling for all pages
├─ appointment.js      # Booking logic
├─ staff.js            # Staff dashboard logic
├─ queue.js            # Virtual queue logic
```

## How to Use (Student)

1. Open `index.html` in your browser
2. Navigate to "Book Appointment"
3. Fill the form and submit
4. View confirmation message

### Virtual Queue (Sprint 2)

1. Go to "Join Queue" page
2. Enter required details
3. View your position and wait-time

## How to Use (Staff)

1. Open `staff.html`
2. View all daily appointments
3. Use delete or update functions

## Dependencies

This is a **static frontend**. No build tools or libraries required. You only need a browser to run the HTML files or host with a simple static server.

## Notes

- All frontend logic communicates with the backend APIs at `http://localhost:<PORT>/api/...`
- For full functionality, the backend server must be running.
