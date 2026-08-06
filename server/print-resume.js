const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/careeros";
const userId = "6a61b63cef17153ab4d465a3"; // harshdeep@gmail.com

async function print() {
  try {
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    const resume = await db.collection("resumes").findOne({ userId: new mongoose.Types.ObjectId(userId) });
    console.log("Resume Document:", JSON.stringify(resume, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

print();
