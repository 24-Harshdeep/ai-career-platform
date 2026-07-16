const mongoose = require("mongoose");

const LearningProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subSkillId: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  xpEarned: { type: Number, default: 0 }
}, { timestamps: true });

// Enforce compound uniqueness index so users can only have 1 progress document per sub-skill
LearningProgressSchema.index({ userId: 1, subSkillId: 1 }, { unique: true });

module.exports = mongoose.model("LearningProgress", LearningProgressSchema);
