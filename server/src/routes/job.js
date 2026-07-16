const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const jobService = require("../services/job.service");

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

// 1. Match and analyze JD compatibility
router.post("/match", authMiddleware, async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return errorResponse(res, "Missing parameter: 'description' is required.");
  }

  try {
    const data = await jobService.matchAndSaveJob(req.user._id || req.user.id, {
      ...req.body,
      status: "Saved"
    });
    return successResponse(res, "Job description analyzed successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to analyze job: ${err.message}`, [], 500);
  }
});

// 2. Save opportunity to pipeline board
router.post("/save", authMiddleware, async (req, res) => {
  try {
    const data = await jobService.matchAndSaveJob(req.user._id || req.user.id, req.body);
    return successResponse(res, "Job opportunity saved to pipeline successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to save opportunity: ${err.message}`, [], 500);
  }
});

// 3. Fetch active applications pipeline board
router.get("/pipeline", authMiddleware, async (req, res) => {
  try {
    const data = await jobService.getJobPipeline(req.user._id || req.user.id);
    return successResponse(res, "Hiring pipeline retrieved successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve pipeline: ${err.message}`, [], 500);
  }
});

// 4. Update Opportunity status stage
router.put("/status", authMiddleware, async (req, res) => {
  const { opportunityId, status } = req.body;
  if (!opportunityId || !status) {
    return errorResponse(res, "Missing parameters: 'opportunityId' and 'status' are required.");
  }

  try {
    const data = await jobService.updateJobStatus(req.user._id || req.user.id, opportunityId, status);
    return successResponse(res, "Hiring pipeline stage updated successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to update status: ${err.message}`, [], 500);
  }
});

// 5. Delete opportunity from board
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await jobService.deleteJobOpportunity(req.user._id || req.user.id, req.params.id);
    return successResponse(res, "Job opportunity deleted successfully.", null);
  } catch (err) {
    return errorResponse(res, `Failed to delete opportunity: ${err.message}`, [], 500);
  }
});

module.exports = router;
