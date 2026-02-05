# QueueLess Campus – Smart Appointment & Queue Management System

## 📋 Project Overview
QueueLess Campus is a web-based appointment and virtual queue management system designed for university campuses. The system allows students to book appointments and join virtual queues online, while staff can efficiently manage appointments and queue flow without physical waiting lines.

## 👥 Team Members
- **Sadeepa Bandara** – Lead Developer
- **Dhwani Thakor** – Frontend Developer
- **Pushpinder Singh** – Junior Frontend Developer

## 🚀 Key Features

### Student Features
- Book appointments for campus services
- Select preferred date and time slots
- Join a virtual queue
- View queue position and estimated wait time
- Receive confirmation messages

### Staff Features
- View daily appointments
- Manage appointment records
- Remove completed or cancelled appointments
- Monitor virtual queue status

## 🛠️ Technology Stack
- **Frontend:** HTML5, CSS3, JavaScript  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB Atlas  
- **Architecture:** MVC (Model–View–Controller)

## 📂 Project Structure
```
queueless-campus/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── tests/
│   └── server.js
│
└── frontend/
    ├── index.html          # Homepage
    ├── appointment.html    # Appointment booking page
    ├── queue.html          # Virtual queue page
    ├── staff.html          # Staff dashboard
    ├── login.html          # User login page
    ├── signup.html         # User registration page
    ├── style.css           # Shared styling
    ├── appointment.js
    ├── queue.js
    └── staff.js
```

## ▶️ Running the Project

### Backend
1. Navigate to the backend folder
   ```bash
   cd backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file with:
   ```
   PORT=8080
   MONGO_URI=mongodb_connection_string
   ```

4. Start the server
   ```bash
   npm start
   ```

### Frontend
1. Open `index.html` in a browser
2. Ensure the backend server is running for full functionality

## 📌 Notes
- Frontend communicates with backend APIs via `http://localhost:<port>/api/...`
- All data is stored and retrieved from MongoDB Atlas
- The system is designed to support scalable campus service workflows

## 🎓 Academic Information
- **Unit:** SIT725 – Applied Software Engineering
- **Institution:** Deakin University
- **Year:** 2025
