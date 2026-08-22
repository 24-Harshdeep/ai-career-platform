const mongoose = require("mongoose");

const SkillSetSchema = new mongoose.Schema({
  technical: [{ type: String }],
  soft: [{ type: String }],
  tools: [{ type: String }],
  frameworks: [{ type: String }],
  languages: [{ type: String }],
  cloud: [{ type: String }],
  devops: [{ type: String }]
}, { _id: false });

const CareerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  targetRole: { type: String, required: true, default: "" },
  experienceLevel: { 
    type: String, 
    enum: ["Beginner", "Intermediate", "Advanced"], 
    default: "Intermediate" 
  },
  careerGoal: { type: String, default: "" },
  currentPhase: { type: String, default: "" },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  skillsPossessed: { type: SkillSetSchema, default: () => ({}) },
  skillsTarget: { type: SkillSetSchema, default: () => ({}) },
  preferredLearningStyle: { type: String, default: "" },
  preferredJobType: { type: String, default: "" },
  targetCompanies: [{ type: String }],
  isOnboardingComplete: { type: Boolean, default: false },
  aiPersonality: { type: String, default: "Career Coach" },
  aiResponseLength: { type: String, default: "Detailed" },
  aiRecommendationFreq: { type: String, default: "Daily" },
  aiTemperature: { type: Number, default: 0.5 },
  preferredIndustry: { type: String, default: "" },
  countryLocale: { type: String, default: "" },
  targetSalary: { type: String, default: "" },
  workType: { type: String, default: "" },
  githubUrl: { type: String, default: "" },
  themeMode: { type: String, default: "Dark" },
  accentColor: { type: String, default: "Purple" },
  primaryResume: { type: String, default: "" },
  primaryPortfolio: { type: String, default: "" },
  linkedinUrl: { type: String, default: "" },
  portfolioUrl: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("CareerProfile", CareerProfileSchema);
