const mongoose = require("mongoose");

const InterviewReportSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "InterviewSession", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, required: true },
  type: { type: String, required: true },
  difficulty: { type: String, required: true },
  overallScore: { type: Number, default: 0 },
  subscores: {
    technicalKnowledge: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    answerRelevance: { type: Number, default: 0 },
    completeness: { type: Number, default: 0 },
    clarity: { type: Number, default: 0 }
  },
  strengths: [{ type: String }],
  weakAreas: [{ type: String }],
  repeatedMistakes: [{ type: String }],
  qaAnalysis: [{
    question: { type: String },
    answer: { type: String },
    score: { type: Number, default: 0 },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    idealAnswer: { type: String },
    coachAdvice: { type: String }
  }],
  recommendedTopics: [{ type: String }],
  recommendedPractice: [{ type: String }],
  nextBestAction: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("InterviewReport", InterviewReportSchema);
