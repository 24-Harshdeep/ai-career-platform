const mongoose = require("mongoose");

const InterviewQuestionSchema = new mongoose.Schema({
  role: { type: String, required: true },
  category: { 
    type: String, 
    enum: ["Technical", "Behavioral", "System Design", "HR", "Machine Coding", "Resume Based", "Project Discussion"], 
    required: true 
  },
  difficulty: { type: String, enum: ["Junior", "Intermediate", "Senior"], default: "Intermediate" },
  question: { type: String, required: true },
  expectedConcepts: [{ type: String }],
  expectedKeywords: [{ type: String }],
  hints: [{ type: String }],
  solutionOutline: { type: String, default: "" },
  tags: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model("InterviewQuestion", InterviewQuestionSchema);
