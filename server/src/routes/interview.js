const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const interviewService = require("../services/interview.service");
const InterviewSession = require("../models/InterviewSession");
const { toInterviewSessionDTO } = require("../dto/interview.dto");

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

// 1. Start a mock interview session
router.post("/start", authMiddleware, async (req, res) => {
  const { role, type, difficulty } = req.body;
  if (!role) {
    return errorResponse(res, "Missing parameter: 'role' is required.");
  }

  try {
    const data = await interviewService.startSession(req.user._id || req.user.id, {
      role,
      type: type || "Technical",
      difficulty: difficulty || "Intermediate"
    });
    return successResponse(res, "Mock interview session started successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to start session: ${err.message}`, [], 500);
  }
});

// 2. Submit answer to active question
router.post("/answer", authMiddleware, async (req, res) => {
  const { sessionId, answer, duration } = req.body;
  if (!sessionId || !answer) {
    return errorResponse(res, "Missing parameters: 'sessionId' and 'answer' are required.");
  }

  try {
    const data = await interviewService.submitAnswer(
      req.user._id || req.user.id,
      sessionId,
      answer,
      duration || 30
    );
    return successResponse(res, "Mock answer evaluated successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to evaluate answer: ${err.message}`, [], 500);
  }
});

// 3. Conclude mock session and generate reports
router.post("/finish", authMiddleware, async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return errorResponse(res, "Missing parameter: 'sessionId' is required.");
  }

  try {
    const data = await interviewService.finishSession(req.user._id || req.user.id, sessionId);
    return successResponse(res, "Mock session completed successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to finish session: ${err.message}`, [], 500);
  }
});

// 4. Fetch session history list
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const data = await interviewService.getSessionHistory(req.user._id || req.user.id);
    return successResponse(res, "Mock interview history retrieved successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve history: ${err.message}`, [], 500);
  }
});

// 5. Fetch mistake aggregates and readiness metrics
router.get("/readiness", authMiddleware, async (req, res) => {
  try {
    const data = await interviewService.getReadinessSummary(req.user._id || req.user.id);
    return successResponse(res, "Interview readiness aggregated successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to fetch readiness summary: ${err.message}`, [], 500);
  }
});

// 6. Fetch specific report
router.get("/report/:sessionId", authMiddleware, async (req, res) => {
  try {
    const session = await InterviewSession.findOne({ 
      _id: req.params.sessionId, 
      userId: req.user._id || req.user.id 
    });
    if (!session) {
      return errorResponse(res, "Session not found.", [], 404);
    }
    return successResponse(res, "Session report retrieved successfully.", toInterviewSessionDTO(session));
  } catch (err) {
    return errorResponse(res, `Failed to fetch report details: ${err.message}`, [], 500);
  }
});

module.exports = router;
