const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const analyticsService = require("../services/analytics.service");

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

// 1. Fetch consolidated Executive Dashboard analytics payload
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const data = await analyticsService.compileDashboardData(req.user._id || req.user.id);
    return successResponse(res, "Executive Dashboard analytics compiled successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to compile analytics: ${err.message}`, [], 500);
  }
});

module.exports = router;
