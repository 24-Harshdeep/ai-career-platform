const mongoose = require("mongoose");

const NextActionSchema = new mongoose.Schema({
  gap: { type: String, required: true },
  evidence: { type: String, required: true },
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  expectedImpact: { type: Number, default: 2 }
}, { _id: false });

const JobAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  jobOpportunityId: { type: mongoose.Schema.Types.ObjectId, ref: "JobOpportunity", required: true },
  matchScore: { type: Number, required: true },
  skillGap: [{ type: String }],
  resumeScore: { type: Number, default: 80 },
  githubScore: { type: Number, default: 80 },
  portfolioScore: { type: Number, default: 80 },
  experienceGap: { type: String, default: "" },
  salaryFit: { type: Number, default: 100 },
  recommendation: { type: String, enum: ["Apply Now", "Wait"], default: "Apply Now" },
  nextActions: [NextActionSchema],
  analysisVersion: { type: String, default: "v1.0.0" },
  analyzedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("JobAnalysis", JobAnalysisSchema);
