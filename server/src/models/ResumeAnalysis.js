const mongoose = require("mongoose");

const MissingKeywordSchema = new mongoose.Schema({
  keyword: { type: String, required: true },
  importance: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  reason: { type: String, required: true },
  expectedScoreGain: { type: Number, default: 2 },
  expectedReadinessGain: { type: Number, default: 3 }
}, { _id: false });

const ResumeAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true },
  atsScore: { type: Number, required: true },
  breakdown: {
    keywords: { type: Number, default: 80 },
    projects: { type: Number, default: 80 },
    skills: { type: Number, default: 80 },
    formatting: { type: Number, default: 90 },
    actionVerbs: { type: Number, default: 70 },
    quantifiedImpact: { type: Number, default: 60 }
  },
  missingKeywords: [MissingKeywordSchema],
  suggestedImprovements: [{ type: String }],
  truthfulnessReport: {
    exaggeratedSkills: [{ type: String }],
    missingVerifiedSkills: [{ type: String }]
  },
  analysisVersion: { type: String, default: "v1.0.0" },
  analyzedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("ResumeAnalysis", ResumeAnalysisSchema);
