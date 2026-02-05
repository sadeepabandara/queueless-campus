// Script to completely reset the users collection
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/queueless-campus";

async function resetDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const users = db.collection("users");

    // Drop the entire collection
    console.log("Dropping users collection...");
    await users.drop();
    console.log("Collection dropped");

    // Create a new collection with proper indexes
    console.log("Creating new collection with indexes...");
    await db.createCollection("users", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["firstName", "lastName", "studentId", "email", "password", "role"],
          properties: {
            firstName: { bsonType: "string" },
            lastName: { bsonType: "string" },
            studentId: { bsonType: "string" },
            email: { bsonType: "string" },
            password: { bsonType: "string" },
            role: { bsonType: "string" }
          }
        }
      }
    });

    // Get the new collection
    const newUsers = db.collection("users");

    // Create indexes with case-insensitive collation
    await newUsers.createIndex({ email: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
    await newUsers.createIndex({ studentId: 1 }, { unique: true });
    console.log("Indexes created with case-insensitive collation");

    console.log("\n✅ Database completely reset!");
    console.log("Try registering again.\n");

    process.exit(0);
  } catch (error) {
    // Collection might not exist, which is fine
    if (error.codeName === "NamespaceNotFound") {
      console.log("Collection doesn't exist, creating fresh...");
      const db = mongoose.connection.db;
      await db.createCollection("users", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["firstName", "lastName", "studentId", "email", "password", "role"],
            properties: {
              firstName: { bsonType: "string" },
              lastName: { bsonType: "string" },
              studentId: { bsonType: "string" },
              email: { bsonType: "string" },
              password: { bsonType: "string" },
              role: { bsonType: "string" }
            }
          }
        }
      });
      const newUsers = db.collection("users");
      await newUsers.createIndex({ email: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
      await newUsers.createIndex({ studentId: 1 }, { unique: true });
      console.log("✅ Fresh collection created with proper indexes!");
      process.exit(0);
    }
    console.error("Error:", error.message);
    process.exit(1);
  }
}

resetDatabase();
