# QueueLess Campus - Frontend

## 📱 Pages Overview

### 1. Home Page (index.html)
The landing page showcasing features and services.
- Hero section with call-to-action buttons
- Features grid
- Services information
- Navigation menu

### 2. Appointment Booking (appointment.html)
Student-facing page for booking appointments.
- Service type selection
- Date and time picker
- Form validation
- Success/error messaging

### 3. Staff Dashboard (staff.html)
Staff interface for managing appointments.
- Appointments table view
- Update and delete functionality
- Date filtering
- Status badges

## 🎨 Styling
All pages use `style.css` with:
- Professional blue color theme
- Responsive design for mobile/tablet
- Modern card layouts
- Smooth animations

## 📝 JavaScript Files
- **appointment.js** - Handles appointment booking form
- **staff.js** - Manages staff dashboard functionality

## 🌐 API Integration
Frontend communicates with backend API at:
- Local: `http://localhost:8080/api/appointments`

## 🎯 User Flows

**Student Flow:**
1. Visit home page
2. Click "Book Appointment"
3. Fill appointment form
4. Submit and receive confirmation

**Staff Flow:**
1. Visit staff dashboard
2. View all appointments
3. Update status or delete as needed
4. Filter by date if required
