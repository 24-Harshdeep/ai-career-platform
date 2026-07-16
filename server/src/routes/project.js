const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const projectService = require("../services/project.service");

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

// 1. Trigger live project deployment audit
router.post("/audit", authMiddleware, async (req, res) => {
  const { url, title, projectType } = req.body;
  if (!url) {
    return errorResponse(res, "Missing parameter: 'url' is required.");
  }

  try {
    const data = await projectService.auditProject(
      req.user._id || req.user.id,
      url,
      title,
      projectType
    );
    return successResponse(res, "Project deployment audited successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to audit project: ${err.message}`, [], 500);
  }
});

// 2. Fetch Project Audit History list
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const data = await projectService.getProjectHistory(req.user._id || req.user.id);
    return successResponse(res, "Project audits history retrieved successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve history: ${err.message}`, [], 500);
  }
});

// 3. Fetch summary metrics aggregated data DTO
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const history = await projectService.getProjectHistory(req.user._id || req.user.id);
    const count = history.length;
    const avgScore = count > 0 
      ? Math.round(history.reduce((sum, h) => sum + h.overallScore, 0) / count)
      : 84;

    const data = {
      projectCount: count,
      averageScore: avgScore,
      latestAuditedProject: count > 0 ? history[0].title : "MERN eCommerce",
      latestScore: count > 0 ? history[0].overallScore : 84
    };

    return successResponse(res, "Project summary details retrieved successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve summary: ${err.message}`, [], 500);
  }
});

// 4. Fetch single audited report
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const data = await projectService.getProjectAnalysis(
      req.user._id || req.user.id,
      req.params.id
    );
    if (!data) {
      return errorResponse(res, "Project audit report not found.", [], 404);
    }
    return successResponse(res, "Audited project report retrieved successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve report: ${err.message}`, [], 500);
  }
});

module.exports = router;
