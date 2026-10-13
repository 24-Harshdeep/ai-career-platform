const mongoose = require("mongoose");

const CareerAiSummarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  content: { type: String, required: true },
  targetRole: { type: String, required: true },
  careerGoal: { type: String, default: "" },
  experienceLevel: { type: String, default: "Intermediate" },
  versionNumber: { type: Number, default: 1 },
  status: { type: String, enum: ["CURRENT", "STALE"], default: "CURRENT" },
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("CareerAiSummary", CareerAiSummarySchema);
