const express = require("express");
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
    return errorResponse(res, `Failed to retrieve roadmap: ${err.message}`, [], 500);
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
    return errorResponse(res, `Failed to update progress: ${err.message}`, [], 500);
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
    return errorResponse(res, `Failed to complete mission: ${err.message}`, [], 500);
  }
});

module.exports = router;
