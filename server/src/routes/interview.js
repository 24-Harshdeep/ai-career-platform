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

// 1. Create session (POST /session or POST /start)
router.post(["/session", "/start"], authMiddleware, async (req, res) => {
  const { role, type, difficulty, questionCount } = req.body;
  if (!role) {
    return errorResponse(res, "Missing parameter: 'role' is required.");
  }

  try {
    const data = await interviewService.startSession(req.user._id || req.user.id, {
      role,
      type: type || "Technical",
      difficulty: difficulty || "Intermediate",
      questionCount: questionCount ? parseInt(questionCount, 10) : undefined
    });
    return successResponse(res, "Mock interview session initialized.", data);
  } catch (err) {
    return errorResponse(res, `Failed to start session: ${err.message}`, [], 500);
  }
});

// 2. Fetch specific active session (GET /session/:id)
router.get("/session/:id", authMiddleware, async (req, res) => {
  try {
    const data = await interviewService.getInterviewSession(
      req.user._id || req.user.id,
      req.params.id
    );
    if (!data) {
      return errorResponse(res, "Interview session not found.", [], 404);
    }
    return successResponse(res, "Session retrieved successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to fetch session: ${err.message}`, [], 500);
  }
});

// 3. Start live interview session (POST /session/:id/start)
router.post("/session/:id/start", authMiddleware, async (req, res) => {
  try {
    const sessionData = await interviewService.getInterviewSession(
      req.user._id || req.user.id,
      req.params.id
    );
    if (!sessionData) {
      return errorResponse(res, "Session not found.", [], 404);
    }
    return successResponse(res, "Live interview started.", sessionData);
  } catch (err) {
    return errorResponse(res, `Failed to start live session: ${err.message}`, [], 500);
  }
});

// 4. Submit live adaptive answer (POST /session/:id/answer or POST /answer)
router.post(["/session/:id/answer", "/answer"], authMiddleware, async (req, res) => {
  const sessionId = req.params.id || req.body.sessionId;
  const { answer, duration } = req.body;

  if (!sessionId || !answer) {
    return errorResponse(res, "Missing required parameters: 'sessionId' and 'answer'.");
  }

  try {
    const data = await interviewService.submitLiveAnswer(
      req.user._id || req.user.id,
      sessionId,
      answer,
      duration || 30
    );
    return successResponse(res, "Live answer evaluated adaptively.", data);
  } catch (err) {
    return errorResponse(res, `Failed to evaluate answer: ${err.message}`, [], 500);
  }
});

// 5. Conclude session (POST /session/:id/end or POST /finish)
router.post(["/session/:id/end", "/finish"], authMiddleware, async (req, res) => {
  const sessionId = req.params.id || req.body.sessionId;
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

// 6. Fetch Report details (GET /session/:id/report or GET /report/:sessionId)
router.get(["/session/:id/report", "/report/:sessionId"], authMiddleware, async (req, res) => {
  const sessionId = req.params.id || req.params.sessionId;
  try {
    const reportData = await interviewService.getInterviewReport(
      req.user._id || req.user.id,
      sessionId
    );
    if (!reportData) {
      return errorResponse(res, "Report not found.", [], 404);
    }
    return successResponse(res, "Interview report retrieved successfully.", reportData);
  } catch (err) {
    return errorResponse(res, `Failed to fetch report: ${err.message}`, [], 500);
  }
});

// 7. Fetch session history list (GET /history)
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const data = await interviewService.getSessionHistory(req.user._id || req.user.id);
    return successResponse(res, "Mock interview history retrieved successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve history: ${err.message}`, [], 500);
  }
});

// 8. Fetch mistake aggregates and readiness metrics (GET /readiness)
router.get("/readiness", authMiddleware, async (req, res) => {
  try {
    const data = await interviewService.getReadinessSummary(req.user._id || req.user.id);
    return successResponse(res, "Interview readiness aggregated successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to fetch readiness summary: ${err.message}`, [], 500);
  }
});

module.exports = router;
