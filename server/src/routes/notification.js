const express = require("express");
const { getErrorMessage } = require("../utils/errorMessage");
const crypto = require("crypto");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const notificationService = require("../services/notification.service");

// Helper: Standardize Success JSON Envelope
const successResponse = (res, message, data) => {
  return res.json({
    success: true,
    message,
    data
  });
};

// Helper: Standardize Error JSON Envelope
const errorResponse = (res, message, errors = [], status = 400) => {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
};

// 1. Fetch user notifications list
router.get("/", authMiddleware, async (req, res) => {
  try {
    const data = await notificationService.getNotifications(req.user._id || req.user.id);
    return successResponse(res, "Notifications list fetched successfully.", data);
  } catch (err) {
    return errorResponse(res, getErrorMessage(err, "Failed to retrieve notifications"), [], 500);
  }
});

// 2. Mark specific notification (or 'all') as read
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const success = await notificationService.markAsRead(req.user._id || req.user.id, req.params.id);
    if (!success) {
      return errorResponse(res, "Failed to update notification state.");
    }
    return successResponse(res, "Notification marked as read successfully.", null);
  } catch (err) {
    return errorResponse(res, getErrorMessage(err, "Failed to mark notification read"), [], 500);
  }
});

// 3. Receive external GitHub commit webhook push delivery
router.post("/webhooks/github", async (req, res) => {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return errorResponse(res, "GitHub webhook processing is not configured.", [], 503);
  }

  const signature = req.get("X-Hub-Signature-256") || "";
  if (!/^sha256=[a-f0-9]{64}$/i.test(signature) || !Buffer.isBuffer(req.rawBody)) {
    return errorResponse(res, "Invalid GitHub webhook signature.", [], 401);
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.rawBody)
    .digest();
  const receivedSignature = Buffer.from(signature.slice("sha256=".length), "hex");
  if (
    receivedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    return errorResponse(res, "Invalid GitHub webhook signature.", [], 401);
  }

  if (req.get("X-GitHub-Event") !== "push") {
    return res.status(202).json({ success: true, message: "Webhook event ignored." });
  }

  const deliveryId = req.get("X-GitHub-Delivery");
  if (!deliveryId || deliveryId.length > 255) {
    return errorResponse(res, "A valid GitHub delivery ID is required.", [], 400);
  }

  try {
    const result = await notificationService.handleGithubPushWebhook(deliveryId, req.body);
    if (result.status === "Failed") {
      console.error("[GitHub Webhook] Delivery processing failed.");
      return errorResponse(res, "Webhook delivery could not be processed.", [], 500);
    }
    return successResponse(res, "Webhook delivery processed.", result);
  } catch (err) {
    console.error("[GitHub Webhook] Delivery processing failed:", err.message);
    return errorResponse(res, "Webhook delivery could not be processed.", [], 500);
  }
});

module.exports = router;
