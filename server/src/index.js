const express = require("express");
const cors = require("cors");
const path = require("path");
// Load environment variables from project root, server root, or local CWD
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config();
const { connectDB } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Gracefully connect to Database
connectDB();

// Basic Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// API Routes prefix mounting
app.use("/api/auth", require("./routes/auth"));
app.use("/api/career", require("./routes/career"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/roadmap", require("./routes/roadmap"));
app.use("/api/recommendation", require("./routes/recommendation"));
app.use("/api/resume", require("./routes/resume"));
app.use("/api/developer", require("./routes/developer"));
app.use("/api/project", require("./routes/project"));
app.use("/api/coach", require("./routes/coach"));
app.use("/api/job", require("./routes/job"));
app.use("/api/interview", require("./routes/interview"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/notifications", require("./routes/notification"));
app.use("/api", require("./routes/api"));

// Start Server
app.listen(PORT, () => {
  console.log(`[CareerOS Server] running on http://localhost:${PORT}`);
});
