const mongoose = require("mongoose");

const RecommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  actionId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["Learning", "Resume", "GitHub", "Portfolio", "Interview", "Application", "Networking", "Project", "Open Source", "DSA", "Communication", "Skill", "Career", "Certification", "Education", "System Design", "General", "Roadmap"],
    required: true
  },
  priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  impactScore: { type: Number, default: 1 },
  estimatedTime: { type: String, required: true },
  confidence: { type: Number, default: 80 },
  reason: { type: String, required: true },
  dependencies: [{ type: String }],
  status: { type: String, enum: ["Active", "Completed", "Skipped"], default: "Active" },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

// Enforce single active recommendation per user-action compound key
RecommendationSchema.index({ userId: 1, actionId: 1, status: 1 });

module.exports = mongoose.model("Recommendation", RecommendationSchema);
