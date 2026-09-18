const mongoose = require("mongoose");

const ResumeVersionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  title: { type: String, required: true }, // e.g., "Original Upload", "ATS Optimized v1", etc.
  optimizationGoal: { type: String, default: "ATS Optimization" },
  personalInfo: {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
    portfolioUrl: { type: String, default: "" }
  },
  summary: { type: String, default: "" },
  workExperience: [{
    company: { type: String, default: "" },
    position: { type: String, default: "" },
    employmentType: { type: String, default: "" },
    location: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    currentlyWorking: { type: Boolean, default: false },
    description: { type: String, default: "" },
    bulletPoints: [{ type: String }],
    experienceUrl: { type: String, default: "" }
  }],
  projects: [{
    title: { type: String, default: "" },
    technologies: [{ type: String }],
    description: { type: String, default: "" },
    bulletPoints: [{ type: String }],
    link: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    liveUrl: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" }
  }],
  skills: {
    languages: [{ type: String }],
    frontend: [{ type: String }],
    backend: [{ type: String }],
    database: [{ type: String }],
    tools: [{ type: String }],
    other: [{ type: String }]
  },
  education: [{
    institution: { type: String, default: "" },
    degree: { type: String, default: "" },
    fieldOfStudy: { type: String, default: "" },
    major: { type: String, default: "" },
    location: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    currentlyStudying: { type: Boolean, default: false },
    gpa: { type: String, default: "" },
    description: { type: String, default: "" },
    institutionUrl: { type: String, default: "" }
  }],
  achievements: [{ type: String }],
  certifications: [{
    name: { type: String, default: "" },
    issuer: { type: String, default: "" },
    issueDate: { type: String, default: "" },
    credentialId: { type: String, default: "" },
    credentialUrl: { type: String, default: "" },
    evidenceText: { type: String, default: "" },
    source: { type: String, default: "resume" },
    confidence: { type: Number, default: 100 },
    isRelevant: { type: Boolean, default: true }
  }],
  leadership: [{
    title: { type: String, default: "" },
    organization: { type: String, default: "" },
    location: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    description: { type: String, default: "" },
    bulletPoints: [{ type: String }],
    url: { type: String, default: "" }
  }],
  activities: [{
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    url: { type: String, default: "" }
  }],
  links: [{
    label: { type: String, default: "" },
    url: { type: String, default: "" },
    type: { type: String, default: "other" },
    source: { type: String, default: "resume" }
  }],
  createdAt: { type: Date, default: Date.now }
});

const ResumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  filename: { type: String, required: true },
  storagePath: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  fileHash: { type: String, required: true },
  parsedText: { type: String, required: true },
  activeVersionId: { type: Number, default: 1 },
  versions: [ResumeVersionSchema]
}, { timestamps: true });

module.exports = mongoose.model("Resume", ResumeSchema);
