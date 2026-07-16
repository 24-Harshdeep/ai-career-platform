const mongoose = require("mongoose");

const AchievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  badgeUrl: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Achievement", AchievementSchema);
