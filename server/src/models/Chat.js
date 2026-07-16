const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: String, enum: ["user", "coach"], required: true },
  text: { type: String, required: true },
  timestamp: { type: String, default: () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
}, { timestamps: true });

module.exports = mongoose.model("Chat", ChatSchema);
