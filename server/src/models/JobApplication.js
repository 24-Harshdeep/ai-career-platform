const mongoose = require("mongoose");

const JobApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
  status: {
    type: String,
    enum: ["Saved", "Applied", "Interview", "Offer", "Rejected"],
    default: "Saved"
  },
  savedAt: { type: Date, default: Date.now },
  appliedAt: { type: Date, default: null },
  notes: { type: String, default: "" }
}, { timestamps: true });

JobApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model("JobApplication", JobApplicationSchema);
