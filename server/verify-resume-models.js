const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/careeros";

async function verify() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const Resume = require("./src/models/Resume");
    const ResumeChangeLog = require("./src/models/ResumeChangeLog");

    console.log("Resume Model loaded successfully.");
    console.log("ResumeChangeLog Model loaded successfully.");

    // Print keys
    console.log("Resume Schema Paths:", Object.keys(Resume.schema.paths));
    console.log("ResumeChangeLog Schema Paths:", Object.keys(ResumeChangeLog.schema.paths));

  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

verify();
