const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: "http://localhost:5000",
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
// MongoDB connection

const mongoURI = process.env.MONGO_URI || 'mongodb://mongo:27017/queueless-campus';
mongoose
    .connect(mongoURI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Routes

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const appointmentRoutes = require('./routes/appointments');
app.use('/api/appointments', appointmentRoutes);

const studentRoutes = require("./routes/studentRoutes");

app.use("/api", studentRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('QueueLess Campus API running');
    
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
