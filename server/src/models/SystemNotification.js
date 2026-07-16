const mongoose = require("mongoose");

const SystemNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["info", "success", "warning", "error"], 
    default: "info" 
  },
  read: { type: Boolean, default: false },
  source: { 
    type: String, 
    enum: ["system", "github", "advisor"], 
    default: "system" 
  },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model("SystemNotification", SystemNotificationSchema);
