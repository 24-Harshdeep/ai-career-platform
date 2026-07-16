const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/careeros";
  try {
    // Mongoose connection setup
    await mongoose.connect(mongoUri);
    console.log("[MongoDB] Connection established successfully.");
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);
    console.log("[MongoDB] Backend server continuing operation in localized offline mode.");
  }
};

module.exports = { connectDB };
