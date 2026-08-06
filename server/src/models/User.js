const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, default: "Harshdeep" },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "Full Stack Developer" },
  goal: { type: String, default: "Full Stack Developer" },
  experience: { 
    type: String, 
    enum: ["Beginner", "Intermediate", "Advanced"], 
    default: "Intermediate" 
  },
  score: { type: Number, default: 82 },
  scoreTrend: { type: Number, default: 4 },
  hasResumeScanned: { type: Boolean, default: false },
  hasGithubScanned: { type: Boolean, default: false },
  projectsCount: { type: Number, default: 3 },
  skillsCount: { type: Number, default: 7 },
  masteredQuestionsCount: { type: Number, default: 1 },
  streakDays: { type: Number, default: 7 },
  longestStreak: { type: Number, default: 7 },
  lastActivityDate: { type: Date, default: Date.now },
  xp: { type: Number, default: 250 },
  level: { type: Number, default: 2 }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
