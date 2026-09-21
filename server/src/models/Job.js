const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String, default: "" },
  website: { type: String, default: "" }
}, { _id: false });

const LocationSchema = new mongoose.Schema({
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  country: { type: String, default: "" },
  remote: { type: Boolean, default: false },
  raw: { type: String, default: "" }
}, { _id: false });

const SalarySchema = new mongoose.Schema({
  min: { type: Number, default: null },
  max: { type: Number, default: null },
  currency: { type: String, default: "USD" },
  period: { type: String, default: "year" }
}, { _id: false });

const JobSchema = new mongoose.Schema({
  provider: { type: String, required: true, index: true },
  externalId: { type: String, default: "" },
  sourceJobId: { type: String, default: "", index: true },
  title: { type: String, required: true, index: true },
  normalizedTitle: { type: String, default: "", index: true },
  company: { type: CompanySchema, required: true },
  companyNormalized: { type: String, default: "", index: true },

  roleFamily: { type: String, default: "Full Stack Development", index: true },
  seniority: { type: String, default: "Mid", index: true },

  description: { type: String, required: true },
  location: { type: LocationSchema, default: () => ({}) },
  normalizedLocation: { type: String, default: "", index: true },
  country: { type: String, default: "IN", index: true },
  remoteType: { type: String, default: "Onsite" }, // Remote, Hybrid, Onsite

  employmentType: { type: String, default: "Full-time" },
  experienceLevel: { type: String, default: "Mid-Level" },
  minimumExperience: { type: Number, default: 0 },
  maximumExperience: { type: Number, default: 10 },

  skills: [{ type: String, index: true }],
  requiredSkills: [{ type: String, index: true }],
  preferredSkills: [{ type: String, index: true }],

  salary: { type: SalarySchema, default: null },
  url: { type: String, required: true },
  publishedAt: { type: Date, default: null, index: true },
  fetchedAt: { type: Date, default: Date.now, index: true },
  lastSeenAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, default: null },

  status: {
    type: String,
    enum: ["ACTIVE", "STALE", "EXPIRED", "REMOVED"],
    default: "ACTIVE",
    index: true
  },

  source: { type: String, required: true },
  sources: [{ type: String }],
  hash: { type: String, required: true, unique: true, index: true },
  providerMetadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

// Compound Indexes
JobSchema.index({ "company.name": 1 });
JobSchema.index({ "location.raw": 1 });
JobSchema.index({ "location.remote": 1 });
JobSchema.index({ publishedAt: -1, fetchedAt: -1 });
JobSchema.index({ roleFamily: 1, seniority: 1 });
JobSchema.index({ country: 1, normalizedLocation: 1 });

module.exports = mongoose.model("Job", JobSchema);
