const SystemNotification = require("../models/SystemNotification");
const WebhookDeliveryLog = require("../models/WebhookDeliveryLog");
const User = require("../models/User");


const { parseGithubPushPayload } = require("../engines/notification/githubWebhook.engine");
const { logCareerEvent } = require("./analytics.service");
const { recalculateUserStats } = require("./career.service");
const { toNotificationDTO } = require("../dto/notification.dto");

// 1. Create alert
async function createNotification(userId, data) {
  const { title, message, type, source, metadata } = data;
  try {
    const alert = await SystemNotification.create({
      userId,
      title,
      message,
      type: type || "info",
      source: source || "system",
      metadata: metadata || {}
    });
    return toNotificationDTO(alert);
  } catch (err) {
    return null;
  }
}

// 2. Fetch notifications
async function getNotifications(userId) {
  try {
    const list = await SystemNotification.find({ userId }).sort({ createdAt: -1 }).limit(20);
    return list.map(toNotificationDTO).filter(Boolean);
  } catch (err) {
    console.error("Notification Service Error in getNotifications:", err);
    throw err;
  }
}

// 3. Mark alert as read
async function markAsRead(userId, notificationId) {
  try {
    if (notificationId === "all") {
      await SystemNotification.updateMany({ userId }, { read: true });
    } else {
      await SystemNotification.updateOne({ _id: notificationId, userId }, { read: true });
    }
    return true;
  } catch (err) {
    return false;
  }
}

// 4. Process GitHub commit Webhook deliveries
async function handleGithubPushWebhook(deliveryId, payload) {
  try {
    const exists = await WebhookDeliveryLog.findOne({ deliveryId });
    if (exists) return { status: "Ignored (Duplicate delivery)" };

    const senderLogin = payload?.sender?.login || payload?.repository?.owner?.login;
    if (!senderLogin) {
      console.warn(`[GitHub Webhook] No sender login found in payload.`);
      return { status: "Failed (No sender info)" };
    }

    const userDoc = await User.findOne({
      $or: [
        { githubUsername: senderLogin },
        { githubUrl: { $regex: senderLogin, $options: "i" } }
      ]
    });

    const userId = userDoc ? userDoc._id : null;
    if (!userId) {
      console.warn(`[GitHub Webhook] No user found matching GitHub username: ${senderLogin}`);
      await WebhookDeliveryLog.create({
        deliveryId,
        payload,
        status: "Failed"
      });
      return { status: "Failed (No matching user)" };
    }

    // Run Webhook Parser Engine
    const parsed = parseGithubPushPayload(payload);

    // Create Notification and Activity event logs
    await SystemNotification.create({
      userId,
      title: parsed.title,
      message: parsed.message,
      type: "success",
      source: "github",
      metadata: parsed.metadata
    });

    await logCareerEvent(
      userId,
      parsed.title,
      "GitHub Webhook",
      parsed.pointsGained,
      parsed.metadata
    );

    // Persist Delivery Log
    await WebhookDeliveryLog.create({
      deliveryId,
      payload,
      status: "Success"
    });

    // Force recalculate Career Score
    await recalculateUserStats(userId);

    return { status: "Success" };
  } catch (err) {
    return { status: "Failed", error: err.message };
  }
}

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  handleGithubPushWebhook
};
