const mongoose = require("mongoose");

const CareerEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  eventType: { type: String, required: true },
  source: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  pointsEarned: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("CareerEvent", CareerEventSchema);
