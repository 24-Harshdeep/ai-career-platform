const mongoose = require("mongoose");

const DeveloperProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  overallHealth: { type: Number, default: 80 },
  engineeringLevel: { 
    type: String, 
    enum: ["Beginner", "Intermediate", "Advanced"], 
    default: "Intermediate" 
  },
  repositoryCount: { type: Number, default: 0 },
  bestRepository: { type: String, default: "" },
  weakestRepository: { type: String, default: "" },
  languageDistribution: {
    type: Map,
    of: Number,
    default: () => ({})
  },
  missingPractices: [{ type: String }],
  lastAnalysis: { type: Date, default: null },
  careerImpact: { type: Number, default: 3 },
  jobReadinessImpact: { type: Number, default: 5 }
}, { timestamps: true });

module.exports = mongoose.model("DeveloperProfile", DeveloperProfileSchema);
