const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "" },
  goal: { type: String, default: "" },
  experience: { 
    type: String, 
    enum: ["Beginner", "Intermediate", "Advanced"], 
    default: "Intermediate" 
  },
  score: { type: Number, default: 0 },
  scoreTrend: { type: Number, default: 0 },
  hasResumeScanned: { type: Boolean, default: false },
  hasGithubScanned: { type: Boolean, default: false },
  projectsCount: { type: Number, default: 0 },
  skillsCount: { type: Number, default: 0 },
  masteredQuestionsCount: { type: Number, default: 0 },
  streakDays: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: null },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
