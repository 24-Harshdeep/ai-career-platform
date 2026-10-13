const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/careeros";
  if (process.env.NODE_ENV === "production" && !process.env.MONGODB_URI && !process.env.MONGO_URI) {
    throw new Error("MONGODB_URI must be configured in production.");
  }

  try {
    // Mongoose connection setup
    await mongoose.connect(mongoUri);
    console.log("[MongoDB] Connection established successfully.");
    return true;
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);
    if (process.env.NODE_ENV === "production") {
      throw new Error("MongoDB connection failed during production startup.");
    }
    console.log("[MongoDB] Backend server continuing operation in localized offline mode.");
    return false;
  }
};

module.exports = { connectDB };
