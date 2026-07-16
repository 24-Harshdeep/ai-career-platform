const mongoose = require("mongoose");

const JobOpportunitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  url: { type: String, default: "" },
  location: { type: String, default: "" },
  salaryRange: { type: String, default: "" },
  description: { type: String, required: true },
  source: { type: String, enum: ["manual", "imported"], default: "manual" },
  status: { 
    type: String, 
    enum: ["Saved", "Preparing", "Applied", "OA", "Interview", "Final Round", "Offer", "Rejected", "Archived"],
    default: "Saved" 
  },
  employmentType: { type: String, default: "Full-time" },
  experienceRequired: { type: String, default: "Intermediate" },
  remote: { type: Boolean, default: false },
  skills: [{ type: String }],
  favorite: { type: Boolean, default: false },
  notes: { type: String, default: "" },
  lastAnalyzed: { type: Date, default: Date.now },
  analysisVersion: { type: String, default: "v1.0.0" }
}, { timestamps: true });

module.exports = mongoose.model("JobOpportunity", JobOpportunitySchema);
