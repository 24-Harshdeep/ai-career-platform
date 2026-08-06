const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/careeros";

async function run() {
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const users = await db.collection("users").find({}).toArray();
  users.forEach(u => {
    console.log(JSON.stringify(u, null, 2));
  });
  process.exit(0);
}

run();
