const mongoose = require("mongoose");

const CareerReportSnapshotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  targetRole: { type: String, required: true },
  careerGoal: { type: String, default: "" },
  careerScore: { type: Number, required: true },
  jobReadiness: { type: Number, required: true },
  confidence: { type: Number, required: true },
  weeklyGrowth: { type: Number, default: 0 },
  monthlyGrowth: { type: Number, default: 0 },
  versionNumber: { type: Number, default: 1 },
  mode: { type: String, enum: ["shareable", "private"], default: "shareable" },
  title: { type: String, default: "" },
  snapshotData: { type: mongoose.Schema.Types.Mixed, required: true },
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("CareerReportSnapshot", CareerReportSnapshotSchema);
