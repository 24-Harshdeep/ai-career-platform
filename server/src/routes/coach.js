const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const coachService = require("../services/coach.service");

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

// 1. Post Chat Query to AI Specialist Coach
router.post("/chat", authMiddleware, async (req, res) => {
  const { message, activePath } = req.body;
  if (!message) {
    return errorResponse(res, "Missing parameter: 'message' is required.");
  }

  try {
    const data = await coachService.generateCoachReply(
      req.user._id || req.user.id,
      activePath || "/dashboard",
      message
    );
    return successResponse(res, "AI Coach replied successfully.", data);
  } catch (err) {
    return errorResponse(res, `AI Coach failed to respond: ${err.message}`, [], 500);
  }
});

module.exports = router;
