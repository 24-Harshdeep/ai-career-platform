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
  modules: [ModuleSchema]
}, { timestamps: true });

module.exports = mongoose.model("Roadmap", RoadmapSchema);
