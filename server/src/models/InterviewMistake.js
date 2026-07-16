const mongoose = require("mongoose");

const InterviewMistakeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  concept: { type: String, required: true },
  frequency: { type: Number, default: 1 },
  lastSeen: { type: Date, default: Date.now },
  severity: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
  resolved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("InterviewMistake", InterviewMistakeSchema);
