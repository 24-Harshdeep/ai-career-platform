const mongoose = require("mongoose");

const MissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  scoreReward: { type: Number, default: 2 }
}, { timestamps: true });

module.exports = mongoose.model("Mission", MissionSchema);
