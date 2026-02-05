// Script to clear the database and remove conflicting users
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/queueless-campus";

async function clearDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Get the users collection
    const users = mongoose.connection.collection("users");

    // Count users before deletion
    const countBefore = await users.countDocuments();
    console.log(`Users found: ${countBefore}`);

    // Delete all users (clear the collection)
    const result = await users.deleteMany({});
    console.log(`Deleted ${result.deletedCount} users`);

    console.log("\n✅ Database cleared successfully!");
    console.log("You can now register fresh users without conflicts.\n");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

clearDatabase();
