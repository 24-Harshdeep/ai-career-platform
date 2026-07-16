const mongoose = require("mongoose");

const ProjectAuditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  projectType: { 
    type: String, 
    enum: ["Portfolio Website", "Backend API", "Chrome Extension", "NPM Package", "AI Project"],
    default: "Portfolio Website" 
  },
  deploymentPlatform: { type: String, default: "Vercel" },
  source: { type: String, enum: ["manual", "github", "imported"], default: "manual" },
  status: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Pending" },
  lastAuditAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound unique constraint per user and url
ProjectAuditSchema.index({ userId: 1, url: 1 }, { unique: true });

module.exports = mongoose.model("ProjectAudit", ProjectAuditSchema);
