const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  company: { type: String, required: true },
  role: { type: String, required: true },
  matchScore: { type: Number, default: 85 },
  status: { 
    type: String, 
    enum: ["Applied", "Interview", "Offer", "Rejected"], 
    default: "Applied" 
  },
  dateApplied: { type: String, default: () => new Date().toISOString().split("T")[0] }
}, { timestamps: true });

module.exports = mongoose.model("Application", ApplicationSchema);
