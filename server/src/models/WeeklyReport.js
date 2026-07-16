const mongoose = require("mongoose");

const WeeklyReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  summary: { type: String, required: true },
  completedTasksCount: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  categoryDelta: { type: mongoose.Schema.Types.Mixed, default: {} },
  nextWeekFocus: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model("WeeklyReport", WeeklyReportSchema);
