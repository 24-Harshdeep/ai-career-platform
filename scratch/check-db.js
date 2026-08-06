const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });
require("dotenv").config();

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/careeros";

async function run() {
  console.log("Connecting to:", mongoUri);
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected successfully!");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    const users = await db.collection("users").find({}).toArray();
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}`);
    });

    const profiles = await db.collection("careerprofiles").find({}).toArray();
    console.log(`Found ${profiles.length} careerprofiles:`);
    profiles.forEach(p => {
      console.log(`- ID: ${p._id}, UserID: ${p.userId}, githubUrl: "${p.githubUrl}", linkedinUrl: "${p.linkedinUrl}", portfolioUrl: "${p.portfolioUrl}"`);
    });

  } catch (err) {
    console.error("DB Check failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
