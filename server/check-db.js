const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/careeros";

async function run() {
  console.log("Connecting to:", mongoUri);
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected successfully!");

    const db = mongoose.connection.db;

    const users = await db.collection("users").find({}).toArray();
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Score: ${u.score}, Streak: ${u.streakDays}`);
    });

    const profiles = await db.collection("careerprofiles").find({}).toArray();
    console.log(`Found ${profiles.length} careerprofiles:`);
    profiles.forEach(p => {
      console.log(`- ID: ${p._id}, UserID: ${p.userId}, githubUrl: "${p.githubUrl}", linkedinUrl: "${p.linkedinUrl}", portfolioUrl: "${p.portfolioUrl}", TargetRole: "${p.targetRole}"`);
    });

  } catch (err) {
    console.error("DB Check failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
