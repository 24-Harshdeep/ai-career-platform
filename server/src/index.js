const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

// Prefer the environment-specific file, while still allowing hosting
// platforms to inject environment variables directly into the process.
const envName = process.env.NODE_ENV || "development";
const envFiles = envName === "production"
  ? [path.join(__dirname, "../.env.production"), path.join(__dirname, "../.env")]
  : [path.join(__dirname, "../.env"), path.join(__dirname, "../../.env")];

for (const envFile of envFiles) {
  dotenv.config({ path: envFile });
}
dotenv.config();
const { connectDB } = require("./config/db");
const { demoGuard, validateDemoConfig } = require("./middleware/demoGuard");


const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed at gateway/frontend level to prevent breakages with external media
    crossOriginEmbedderPolicy: false
  })
);

// CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map(o => o.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation: Origin not allowed."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Body Parsing Limits
// Preserve the original bytes only for signed GitHub webhook verification.
app.use(
  "/api/notifications/webhooks/github",
  express.json({
    limit: "10mb",
    verify: (req, res, buffer) => {
      req.rawBody = Buffer.from(buffer);
    }
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again in 15 minutes." }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 AI operations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI rate limit exceeded. Please wait a moment before sending another request." }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api/", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/interview/session", aiLimiter);
app.use("/api/interview/answer", aiLimiter);
app.use("/api/interview/finish", aiLimiter);
app.use("/api/coach/chat", aiLimiter);
app.use("/api/career/report/ai-summary", aiLimiter);
app.use("/api/resume/optimize", aiLimiter);
app.use("/api/resume/upload", aiLimiter);
app.use("/api/project/audit", aiLimiter);
app.use("/api/career/assessment", aiLimiter);
app.use("/api/job/match", aiLimiter);
app.use("/api/recommendation/regenerate", aiLimiter);

// Gracefully connect to Database
// Basic Health Check
app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "healthy" : "degraded",
    database: databaseConnected ? "connected" : "unavailable",
    timestamp: new Date()
  });
});

// ─── Demo Guard ────────────────────────────────────────────────────────────────
// Centralized read-only enforcement for the public demo account.
// Must be mounted BEFORE all API route handlers so every mutating request
// (POST, PUT, PATCH, DELETE) from the demo user is intercepted in one place.
app.use("/api", demoGuard);

// API Routes prefix mounting
app.use("/api/auth", require("./routes/auth"));
app.use("/api/career/report", require("./routes/report.routes"));
app.use("/api/career", require("./routes/career"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/roadmap", require("./routes/roadmap"));
app.use("/api/recommendation", require("./routes/recommendation"));
app.use("/api/resume", require("./routes/resume"));
app.use("/api/developer", require("./routes/developer"));
app.use("/api/project", require("./routes/project"));
app.use("/api/coach", require("./routes/coach"));
app.use("/api/job", require("./routes/job"));
app.use("/api/jobs", require("./routes/jobs.routes"));
app.use("/api/interview", require("./routes/interview"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/notifications", require("./routes/notification"));

// Safe Production Error Handler
app.use((err, req, res, next) => {
  console.error("[CareerOS Global Error Handler]:", err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === "production" 
    ? "An internal server error occurred."
    : err.message || "Internal server error.";

  res.status(status).json({ error: message });
});

// Start Server
async function startServer() {
  validateDemoConfig(); // Logs demo guard configuration at startup
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[CareerOS Server] listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[CareerOS] Startup failed:", err.message);
  process.exitCode = 1;
});
