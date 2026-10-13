const express = require("express");
const { getErrorMessage } = require("../utils/errorMessage");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const roadmapService = require("../services/roadmap.service");

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

// 1. Fetch User Roadmap Tracks
router.get("/", authMiddleware, async (req, res) => {
  try {
    const data = await roadmapService.getUserRoadmapTracks(req.user._id || req.user.id);
    return successResponse(res, "Roadmap tracks retrieved successfully.", data);
  } catch (err) {
    return errorResponse(res, getErrorMessage(err, "Failed to retrieve roadmap"), [], 500);
  }
});

// 2. Toggle Sub-Skill checklist progress
router.put("/progress", authMiddleware, async (req, res) => {
  const { subSkillId, mastered } = req.body;

  if (!subSkillId || mastered === undefined) {
    return errorResponse(res, "Missing parameters: 'subSkillId' and 'mastered' are required.");
  }

  try {
    const data = await roadmapService.updateSubSkillMastery(
      req.user._id || req.user.id,
      subSkillId,
      mastered
    );
    return successResponse(res, "Sub-skill progress updated successfully.", data);
  } catch (err) {
    return errorResponse(res, getErrorMessage(err, "Failed to update progress"), [], 500);
  }
});

// 3. Complete Daily Mission
router.post("/missions/complete", authMiddleware, async (req, res) => {
  const { missionId } = req.body;

  if (!missionId) {
    return errorResponse(res, "Missing parameter: 'missionId' is required.");
  }

  try {
    const data = await roadmapService.completeDailyMission(
      req.user._id || req.user.id,
      missionId
    );
    return successResponse(res, "Daily mission completed successfully.", data);
  } catch (err) {
    return errorResponse(res, getErrorMessage(err, "Failed to complete mission"), [], 500);
  }
});

// 4. Force Dynamic Roadmap Re-evaluation
router.post("/reevaluate", authMiddleware, async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { reason = "MANUAL_USER_TRIGGER" } = req.body;

  try {
    const { reevaluateRoadmap } = require("../services/roadmapAdaptation.service");
    const data = await reevaluateRoadmap(userId, reason);
    return successResponse(res, "Roadmap re-evaluated and adapted successfully.", data);
  } catch (err) {
    return errorResponse(res, getErrorMessage(err, "Failed to re-evaluate roadmap"), [], 500);
  }
});

// 5. Add Missing Job Gaps to Roadmap
router.post("/add-job-gaps", authMiddleware, async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { jobId, skills = [] } = req.body;

  if (!jobId || !skills.length) {
    return errorResponse(res, "Missing parameters: 'jobId' and 'skills' array are required.");
  }

  try {
    const { addJobGapsToRoadmap } = require("../services/roadmapAdaptation.service");
    const result = await addJobGapsToRoadmap(userId, jobId, skills);
    return successResponse(res, "Job-specific skills added to roadmap successfully.", result);
  } catch (err) {
    return errorResponse(res, getErrorMessage(err, "Failed to add job gaps to roadmap"), [], 500);
  }
});

// 6. Fetch Target Role Live Market Intelligence Signals
router.get("/market-signals", authMiddleware, async (req, res) => {
  const userId = req.user._id || req.user.id;

  try {
    const { getCareerContext } = require("../services/careerContext.service");
    const { getMarketIntelligence } = require("../services/marketIntelligence.service");

    const context = await getCareerContext(userId);
    const data = await getMarketIntelligence(context.targetRole, context.experienceLevel, 30);
    return successResponse(res, "Market intelligence signals fetched successfully.", data);
  } catch (err) {
    return errorResponse(res, getErrorMessage(err, "Failed to fetch market signals"), [], 500);
  }
});

module.exports = router;
