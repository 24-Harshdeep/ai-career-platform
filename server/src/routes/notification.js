const express = require("express");
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
    return errorResponse(res, `Failed to retrieve notifications: ${err.message}`, [], 500);
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
    return errorResponse(res, `Failed to mark notification read: ${err.message}`, [], 500);
  }
});

// 3. Receive external GitHub commit webhook push delivery
router.post("/webhooks/github", async (req, res) => {
  const deliveryId = req.headers["x-github-delivery"] || `github-delivery-${Date.now()}`;
  
  try {
    const result = await notificationService.handleGithubPushWebhook(deliveryId, req.body);
    return successResponse(res, "Webhook delivery processed.", result);
  } catch (err) {
    return errorResponse(res, `Webhook processing failure: ${err.message}`, [], 500);
  }
});

module.exports = router;
