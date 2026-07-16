const mongoose = require("mongoose");

const RoadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  moduleId: { type: String, required: true },
  title: { type: String, required: true },
  progress: { type: Number, default: 0 },
  skills: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model("Roadmap", RoadmapSchema);
