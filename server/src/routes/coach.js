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
  const { message, activePath, sessionId } = req.body;
  if (!message) {
    return errorResponse(res, "Missing parameter: 'message' is required.");
  }

  try {
    const data = await coachService.generateCoachReply(
      req.user._id || req.user.id,
      activePath || "/dashboard",
      message,
      sessionId || null
    );
    return successResponse(res, "AI Coach replied successfully.", data);
  } catch (err) {
    return errorResponse(res, `AI Coach failed to respond: ${err.message}`, [], 500);
  }
});

// 2. Get Chat Sessions List (Threads)
router.get("/sessions", authMiddleware, async (req, res) => {
  try {
    const data = await coachService.getCoachSessions(req.user._id || req.user.id);
    return successResponse(res, "Chat sessions retrieved successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve chat sessions: ${err.message}`, [], 500);
  }
});

// 3. Get Chat History Logs for Session
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const sessionId = req.query.sessionId || null;
    const data = await coachService.getCoachChatHistory(req.user._id || req.user.id, sessionId);
    return successResponse(res, "Chat history retrieved successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve chat history: ${err.message}`, [], 500);
  }
});

module.exports = router;
