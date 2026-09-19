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
  questionId: { type: mongoose.Schema.Types.Mixed }, // String or ObjectId
  questionText: { type: String, default: "" },
  answer: { type: String, default: "" },
  score: { type: Number, default: 0 },
  feedback: InterviewFeedbackSchema,
  duration: { type: Number, default: 0 } // duration in seconds
}, { _id: false });

const ConversationMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["ai", "user", "system"], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  questionId: { type: String, default: "" }
}, { _id: false });

const InterviewEvaluationSchema = new mongoose.Schema({
  questionText: { type: String, default: "" },
  answerText: { type: String, default: "" },
  scores: {
    technicalAccuracy: { type: Number, default: 0 },
    relevance: { type: Number, default: 0 },
    completeness: { type: Number, default: 0 },
    clarity: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    evidence: { type: Number, default: 0 },
    contextConsistency: { type: Number, default: 0 }
  },
  actionTaken: { type: String, default: "NEXT_QUESTION" },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  missedConcepts: [{ type: String }],
  idealAnswer: { type: String, default: "" },
  improvementPlan: { type: String, default: "" }
}, { _id: false });

const InterviewSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, required: true },
  type: { 
    type: String, 
    default: "Technical" 
  },
  difficulty: { type: String, default: "Intermediate" },
  formatMode: { 
    type: String, 
    enum: ["written", "voice_only", "voice_video"], 
    default: "voice_video" 
  },
  status: { type: String, enum: ["Active", "Completed", "Abandoned"], default: "Active" },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  duration: { type: Number, default: 0 }, // total minutes
  totalQuestions: { type: Number, default: 3 },
  currentQuestionIndex: { type: Number, default: 0 },
  overallScore: { type: Number, default: 0 },
  ratings: {
    technicalKnowledge: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    answerQuality: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    roleRelevance: { type: Number, default: 0 }
  },
  technicalScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  problemSolvingScore: { type: Number, default: 0 },
  confidenceScore: { type: Number, default: 0 },
  timeManagementScore: { type: Number, default: 0 },
  readinessIncrease: { type: Number, default: 0 },
  questions: [AnsweredQuestionSchema],
  conversation: [ConversationMessageSchema],
  evaluations: [InterviewEvaluationSchema],
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: "InterviewReport" },
  feedbackSummary: { type: String, default: "" },
  recommendations: [{ type: String }],
  aiVersion: { type: String, default: "v2.0.0" }
}, { timestamps: true });

module.exports = mongoose.model("InterviewSession", InterviewSessionSchema);
