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
  targetRole: { type: String, required: true, default: "Full Stack Developer" },
  experienceLevel: { 
    type: String, 
    enum: ["Beginner", "Intermediate", "Advanced"], 
    default: "Intermediate" 
  },
  careerGoal: { type: String, default: "Transition to Senior Full Stack Engineer role at Stripe/Vercel" },
  currentPhase: { type: String, default: "Foundation Building" },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  skillsPossessed: { type: SkillSetSchema, default: () => ({}) },
  skillsTarget: { type: SkillSetSchema, default: () => ({}) },
  preferredLearningStyle: { type: String, default: "Practical / Build-oriented" },
  preferredJobType: { type: String, default: "Full-Time Remote" },
  targetCompanies: [{ type: String }],
  isOnboardingComplete: { type: Boolean, default: false },
  aiPersonality: { type: String, default: "Career Coach" },
  aiResponseLength: { type: String, default: "Detailed" },
  aiRecommendationFreq: { type: String, default: "Daily" },
  aiTemperature: { type: Number, default: 0.5 },
  preferredIndustry: { type: String, default: "Fintech" },
  countryLocale: { type: String, default: "United States" },
  targetSalary: { type: String, default: "$130,000" },
  workType: { type: String, default: "Remote" }
}, { timestamps: true });

module.exports = mongoose.model("CareerProfile", CareerProfileSchema);
