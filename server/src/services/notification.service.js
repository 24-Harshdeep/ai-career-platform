const SystemNotification = require("../models/SystemNotification");
const WebhookDeliveryLog = require("../models/WebhookDeliveryLog");
const User = require("../models/User");
const CareerProfile = require("../models/CareerProfile");


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
  const senderLogin = payload?.sender?.login || payload?.repository?.owner?.login;
  if (!senderLogin) {
    console.warn("[GitHub Webhook] No sender login found in verified payload.");
    return { status: "Failed" };
  }

  const repository = payload?.repository?.full_name || payload?.repository?.name || "repository";
  let deliveryLog;
  try {
    deliveryLog = await WebhookDeliveryLog.create({
      deliveryId,
      payload: {
        sender: senderLogin,
        repository,
        commitCount: Array.isArray(payload.commits) ? payload.commits.length : 0
      },
      status: "Processing"
    });
  } catch (err) {
    if (err.code === 11000) {
      return { status: "Ignored (Duplicate delivery)" };
    }
    throw err;
  }

  try {
    const escapedSender = senderLogin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const careerProfile = await CareerProfile.findOne({
      githubUrl: { $regex: `(?:^|/)${escapedSender}/?$`, $options: "i" }
    });

    if (!careerProfile) {
      await WebhookDeliveryLog.updateOne({ _id: deliveryLog._id }, { status: "Failed" });
      console.warn("[GitHub Webhook] No user found for verified sender.");
      return { status: "Failed" };
    }

    const userId = careerProfile.userId;
    const parsed = parseGithubPushPayload(payload);

    await SystemNotification.create({
      userId,
      title: parsed.title,
      message: parsed.message,
      type: "success",
      source: "github",
      metadata: parsed.metadata
    });

    await logCareerEvent(userId, parsed.title, "GitHub Webhook", parsed.pointsGained, parsed.metadata);
    await recalculateUserStats(userId);
    await WebhookDeliveryLog.updateOne({ _id: deliveryLog._id }, { status: "Success" });

    return { status: "Success" };
  } catch (err) {
    await WebhookDeliveryLog.updateOne({ _id: deliveryLog._id }, { status: "Failed" });
    throw err;
  }
}

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  handleGithubPushWebhook
};
