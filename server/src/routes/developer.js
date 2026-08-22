const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const developerService = require("../services/developer.service");

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

// 1. Connect GitHub Credentials token
router.post("/github/connect", authMiddleware, (req, res) => {
  const { username, token } = req.body;
  if (!username) {
    return errorResponse(res, "Missing parameter: 'username' is required.");
  }
  return successResponse(res, "GitHub connection credentials stored successfully.", { username });
});

// 2. Trigger Full Sync & Audit
router.post("/github/sync", authMiddleware, async (req, res) => {
  try {
    const data = await developerService.syncDeveloperProfile(
      req.user._id || req.user.id,
      req.body.username
    );
    return successResponse(res, "Developer profile repository sync complete.", data);
  } catch (err) {
    return errorResponse(res, `Failed to sync profile: ${err.message}`, [], 500);
  }
});

// 3. Fetch Dashboard Summary Profile DTO
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const data = await developerService.getDeveloperProfile(req.user._id || req.user.id);
    if (!data) {
      return successResponse(res, "Developer profile not synced yet.", null);
    }
    return successResponse(res, "Developer profile retrieved successfully.", data);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve profile: ${err.message}`, [], 500);
  }
});

// 4. Fetch Synced Repository List
router.get("/repositories", authMiddleware, async (req, res) => {
  try {
    const data = await developerService.getDeveloperProfile(req.user._id || req.user.id);
    return successResponse(res, "Developer repositories retrieved successfully.", data ? data.repositories : []);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve repositories: ${err.message}`, [], 500);
  }
});

// 5. Fetch Overall Health rating details
router.get("/health", authMiddleware, async (req, res) => {
  try {
    const data = await developerService.getDeveloperProfile(req.user._id || req.user.id);
    return successResponse(res, "Developer health ratings retrieved successfully.", data ? {
      overallHealth: data.overallHealth,
      engineeringLevel: data.engineeringLevel,
      technologyCoverage: data.technologyCoverage
    } : null);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve health details: ${err.message}`, [], 500);
  }
});

module.exports = router;
