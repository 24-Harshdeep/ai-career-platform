const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: { type: String, required: true },
  storagePath: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  fileHash: { type: String, required: true },
  parsedText: { type: String, required: true },
  structuredSections: {
    projects: [{ type: String }],
    skills: [{ type: String }],
    experience: [{ type: String }],
    education: [{ type: String }]
  }
}, { timestamps: true });

module.exports = mongoose.model("Resume", ResumeSchema);
