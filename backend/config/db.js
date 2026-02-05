const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://mongo:27017/queueless-campus");

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    console.error("Make sure MongoDB is running locally or Docker is started.");
    process.exit(1);
  }
};

module.exports = connectDB;
