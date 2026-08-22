const mongoose = require("mongoose");

const SubSkillSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  xpReward: { type: Number, default: 50 }
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
  modules: [ModuleSchema]
}, { timestamps: true });

module.exports = mongoose.model("Roadmap", RoadmapSchema);
