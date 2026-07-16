const mongoose = require("mongoose");

const WebhookDeliveryLogSchema = new mongoose.Schema({
  deliveryId: { type: String, required: true, unique: true },
  provider: { type: String, default: "github" },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { 
    type: String, 
    enum: ["Success", "Failed"], 
    default: "Success" 
  },
  processedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("WebhookDeliveryLog", WebhookDeliveryLogSchema);
