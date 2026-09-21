const mongoose = require("mongoose");

const ProviderHealthSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["HEALTHY", "DEGRADED", "UNCONFIGURED", "DISABLED"],
      default: "UNCONFIGURED",
      index: true
    },
    lastCheckedAt: { type: Date, default: Date.now },
    lastSuccessfulFetch: { type: Date, default: null },
    lastFailureReason: { type: String, default: "" },
    resultCount: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProviderHealth", ProviderHealthSchema);
