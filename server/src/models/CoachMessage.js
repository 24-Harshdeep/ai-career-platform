const mongoose = require("mongoose");

const CoachMessageSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  sender: { 
    type: String, 
    enum: ["user", "coach"], 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  activePath: { 
    type: String, 
    default: "" 
  },
  sessionId: {
    type: String,
    index: true,
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Create index on userId, sessionId and createdAt for fast queries
CoachMessageSchema.index({ userId: 1, sessionId: 1, createdAt: 1 });

module.exports = mongoose.model("CoachMessage", CoachMessageSchema);
