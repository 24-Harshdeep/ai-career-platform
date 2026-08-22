const mongoose = require("mongoose");

const ResumeChangeLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume", required: true },
  versionNumber: { type: Number, required: true },
  section: { type: String, required: true }, // e.g., "Work Experience - Google", "Summary"
  originalText: { type: String, required: true },
  rewrittenText: { type: String, required: true },
  editedText: { type: String, default: "" }, // user's manual modifications before accepting
  reason: { type: String, required: true }, // e.g., "Uses stronger action verb..."
  status: { type: String, enum: ["pending", "accepted", "rejected", "edited"], default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("ResumeChangeLog", ResumeChangeLogSchema);
