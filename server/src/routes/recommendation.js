const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const recommendationService = require("../services/recommendation.service");

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

// 1. Get Ranked Recommendations
router.get("/", authMiddleware, async (req, res) => {
  try {
    const data = await recommendationService.getRankedRecommendations(req.user._id || req.user.id);
    return successResponse(res, "Ranked recommendations list retrieved successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve recommendations: ${err.message}`, [], 500);
  }
});

// 2. Mark Recommendation as Completed
router.post("/complete", authMiddleware, async (req, res) => {
  const { actionId } = req.body;
  if (!actionId) {
    return errorResponse(res, "Missing parameter: 'actionId' is required.");
  }

  try {
    const data = await recommendationService.completeRecommendation(
      req.user._id || req.user.id,
      actionId
    );
    return successResponse(res, "Recommendation marked as completed.", data);
  } catch (err) {
    return errorResponse(res, `Failed to complete recommendation: ${err.message}`, [], 500);
  }
});

// 3. Mark Recommendation as Skipped
router.post("/skip", authMiddleware, async (req, res) => {
  const { actionId } = req.body;
  if (!actionId) {
    return errorResponse(res, "Missing parameter: 'actionId' is required.");
  }

  try {
    const data = await recommendationService.skipRecommendation(
      req.user._id || req.user.id,
      actionId
    );
    return successResponse(res, "Recommendation marked as skipped.", data);
  } catch (err) {
    return errorResponse(res, `Failed to skip recommendation: ${err.message}`, [], 500);
  }
});

// 4. Force Regeneration of Recommendations
router.post("/regenerate", authMiddleware, async (req, res) => {
  try {
    const data = await recommendationService.forceRegenerate(req.user._id || req.user.id);
    return successResponse(res, "Recommendations list regenerated successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to regenerate recommendations: ${err.message}`, [], 500);
  }
});

module.exports = router;
