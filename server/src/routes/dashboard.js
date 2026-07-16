const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { getDashboardData } = require("../services/dashboard.service");

// Helper: Standardize Success JSON Envelope
const successResponse = (res, message, data) => {
  return res.json({
    success: true,
    message,
    data
  });
};

// 1. Get Dashboard Payload
router.get("/", authMiddleware, async (req, res) => {
  try {
    const data = await getDashboardData(req.user._id || req.user.id);
    return successResponse(res, "Dashboard telemetry retrieved successfully.", data);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Failed to compile dashboard: ${err.message}`
    });
  }
});

module.exports = router;
