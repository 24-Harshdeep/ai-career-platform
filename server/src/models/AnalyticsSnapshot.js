const mongoose = require("mongoose");

const AnalyticsSnapshotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  careerScore: { type: Number, required: true },
  resumeScore: { type: Number, default: 80 },
  developerScore: { type: Number, default: 80 },
  projectScore: { type: Number, default: 80 },
  roadmapScore: { type: Number, default: 50 },
  interviewScore: { type: Number, default: 50 },
  jobReadiness: { type: Number, default: 50 },
  interviewReadiness: { type: Number, default: 50 },
  portfolioReadiness: { type: Number, default: 50 },
  weeklyGrowth: { type: Number, default: 0 },
  monthlyGrowth: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("AnalyticsSnapshot", AnalyticsSnapshotSchema);
