const mongoose = require("mongoose");

const InterviewFeedbackSchema = new mongoose.Schema({
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  missedConcepts: [{ type: String }],
  idealAnswer: { type: String, default: "" },
  improvementPlan: { type: String, default: "" },
  resources: [{ type: String }]
}, { _id: false });

const AnsweredQuestionSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "InterviewQuestion", required: true },
  answer: { type: String, default: "" },
  score: { type: Number, default: 0 },
  feedback: InterviewFeedbackSchema,
  duration: { type: Number, default: 0 } // duration in seconds
}, { _id: false });

const InterviewSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["Technical", "Behavioral", "System Design", "HR", "Machine Coding", "Resume Based", "Project Discussion", "Custom"], 
    default: "Technical" 
  },
  difficulty: { type: String, enum: ["Junior", "Intermediate", "Senior"], default: "Intermediate" },
  status: { type: String, enum: ["Active", "Completed", "Abandoned"], default: "Active" },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  duration: { type: Number, default: 0 }, // total minutes
  overallScore: { type: Number, default: 0 },
  technicalScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  problemSolvingScore: { type: Number, default: 0 },
  confidenceScore: { type: Number, default: 0 },
  timeManagementScore: { type: Number, default: 0 },
  readinessIncrease: { type: Number, default: 0 },
  questions: [AnsweredQuestionSchema],
  feedbackSummary: { type: String, default: "" },
  recommendations: [{ type: String }],
  aiVersion: { type: String, default: "v1.0.0" }
}, { timestamps: true });

module.exports = mongoose.model("InterviewSession", InterviewSessionSchema);
