const mongoose = require("mongoose");

const GithubRepositoryAnalysisSchema = new mongoose.Schema({
  repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: "GithubRepository", required: true },
  analysisVersion: { type: String, default: "v1.0.0" },
  healthScore: { type: Number, required: true, default: 80 },
  documentationScore: { type: Number, default: 80 },
  testingScore: { type: Number, default: 80 },
  architectureScore: { type: Number, default: 80 },
  activityScore: { type: Number, default: 80 },
  maintainabilityScore: { type: Number, default: 80 },
  securityScore: { type: Number, default: 80 },
  missingPractices: [{ type: String }],
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  recommendations: [{ type: String }],
  analyzedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("GithubRepositoryAnalysis", GithubRepositoryAnalysisSchema);
