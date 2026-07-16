const mongoose = require("mongoose");

const GithubRepositorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  url: { type: String, required: true },
  defaultBranch: { type: String, default: "main" },
  visibility: { type: String, enum: ["public", "private"], default: "public" },
  primaryLanguage: { type: String, default: "JavaScript" },
  stars: { type: Number, default: 0 },
  forks: { type: Number, default: 0 },
  watchers: { type: Number, default: 0 },
  topics: [{ type: String }],
  lastSyncedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Enforce unique repository per user-name compound key
GithubRepositorySchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("GithubRepository", GithubRepositorySchema);
