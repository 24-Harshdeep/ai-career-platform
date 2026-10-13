const mongoose = require("mongoose");

const SubSkillSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  xpReward: { type: Number, default: 50 },
  time: { type: String, default: "2 Hours" },
  scoreGain: { type: Number, default: 3 },
  prerequisite: { type: String, default: "None" },
  unlocks: { type: String, default: "Next Milestone" },
  explanation: { type: String, default: "" },
  tip: { type: String, default: "" },
  resources: [{ type: String }]
}, { _id: false });

const ModuleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  subSkills: [SubSkillSchema]
}, { _id: false });

const RoadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  id: { type: String, required: true },
  title: { type: String, required: true },
  reasoning: { type: String, default: "" },
  modules: [ModuleSchema],
  versionNumber: { type: Number, default: 1 },
  lastAdaptedReason: { type: String, default: "INITIAL_GENERATION" },
  changeHistory: [{
    versionNumber: { type: Number, required: true },
    reason: { type: String, required: true },
    summary: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now }
  }],
  pendingProposals: [{
    id: { type: String, required: true },
    skill: { type: String, required: true },
    reason: { type: String, default: "" },
    category: { type: String, default: "Job Requirement" },
    type: { type: String, enum: ["ADD", "DEFER", "REMOVE"], default: "ADD" },
    addedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Roadmap", RoadmapSchema);
