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
  period: { type: String, default: "year" } // e.g. "year", "month", "hour"
}, { _id: false });

const JobSchema = new mongoose.Schema({
  provider: { type: String, required: true, index: true },
  externalId: { type: String, default: "" },
  title: { type: String, required: true, index: true },
  company: { type: CompanySchema, required: true },
  location: { type: LocationSchema, default: () => ({}) },
  employmentType: { type: String, default: "Full-time" }, // e.g., Full-time, Part-time, Contract, Internship
  experienceLevel: { type: String, default: "Mid-Level" }, // e.g., Entry Level, Mid-Level, Senior, Executive
  description: { type: String, required: true },
  skills: [{ type: String, index: true }],
  salary: { type: SalarySchema, default: null },
  url: { type: String, required: true },
  publishedAt: { type: Date, default: null, index: true },
  fetchedAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, default: null },
  source: { type: String, required: true },
  sourceJobId: { type: String, default: "", index: true },
  hash: { type: String, required: true, unique: true, index: true },
  sources: [{ type: String }] // List of providers that matched during deduplication
}, { timestamps: true });

// Additional Compound Indexes
JobSchema.index({ "company.name": 1 });
JobSchema.index({ "location.raw": 1 });
JobSchema.index({ "location.remote": 1 });
JobSchema.index({ publishedAt: -1, fetchedAt: -1 });

module.exports = mongoose.model("Job", JobSchema);
