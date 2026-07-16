const mongoose = require("mongoose");

const ProjectAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "ProjectAudit", required: true },
  overallScore: { type: Number, required: true, default: 80 },
  performanceScore: { type: Number, default: 80 },
  accessibilityScore: { type: Number, default: 80 },
  seoScore: { type: Number, default: 80 },
  documentationScore: { type: Number, default: 80 },
  architectureScore: { type: Number, default: 80 },
  deploymentScore: { type: Number, default: 80 },
  technologyEvidence: {
    hasAuth: { type: Boolean, default: false },
    hasDatabase: { type: Boolean, default: false },
    hasRestApi: { type: Boolean, default: false },
    hasDocker: { type: Boolean, default: false },
    hasTesting: { type: Boolean, default: false },
    hasDevOps: { type: Boolean, default: false }
  },
  missingPractices: [{ type: String }],
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  recommendations: [{ type: String }],
  careerImpact: { type: Number, default: 4 },
  analysisVersion: { type: String, default: "v1.0.0" },
  analyzedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("ProjectAnalysis", ProjectAnalysisSchema);
