const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { SUPPORTED_ROLES } = require("../config/roles");

const careerService = require("../services/career.service");
const { assessCareerOnboarding } = require("../services/careerAssessment.service");

// Helper: Standardize Success JSON Envelope
const successResponse = (res, message, data, status = 200) => {
  return res.status(status).json({
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

// 1. Fetch Profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const profile = await careerService.getProfile(req.user._id || req.user.id);
    return successResponse(res, "Career profile retrieved successfully.", profile);
  } catch (err) {
    return errorResponse(res, `Failed to retrieve profile: ${err.message}`, [], 500);
  }
});

// 2. Update Profile & Goals
router.put("/profile", authMiddleware, async (req, res) => {
  const { targetRole, experienceLevel } = req.body;

  // Validation checks
  if (targetRole && !SUPPORTED_ROLES.includes(targetRole)) {
    return errorResponse(res, `Validation failed: '${targetRole}' is not a supported target role.`, [
      `Role must be one of: ${SUPPORTED_ROLES.join(", ")}`
    ]);
  }

  const validExperiences = ["Beginner", "Intermediate", "Advanced"];
  if (experienceLevel && !validExperiences.includes(experienceLevel)) {
    return errorResponse(res, `Validation failed: '${experienceLevel}' is not a valid experience level.`, [
      "Experience level must be Beginner, Intermediate, or Advanced"
    ]);
  }

  try {
    const profile = await careerService.updateProfile(req.user._id || req.user.id, req.body);
    return successResponse(res, "Career profile updated successfully.", profile);
  } catch (err) {
    return errorResponse(res, `Failed to update profile: ${err.message}`, [], 500);
  }
});

// 3. Post Assessment Surveys
router.post("/assessment", authMiddleware, async (req, res) => {
  try {
    const { strengths, weaknesses } = assessCareerOnboarding(req.body);
    
    // Save assessment results to profile
    const profile = await careerService.updateProfile(req.user._id || req.user.id, {
      strengths,
      weaknesses,
      isOnboardingComplete: true
    });

    return successResponse(res, "Assessment completed successfully.", profile);
  } catch (err) {
    return errorResponse(res, `Failed to compute assessment: ${err.message}`, [], 500);
  }
});

// 4. Fetch Skills Inventory
router.get("/skills", authMiddleware, async (req, res) => {
  try {
    const profile = await careerService.getProfile(req.user._id || req.user.id);
    return successResponse(res, "Skills profile retrieved successfully.", {
      skillsPossessed: profile.skillsPossessed,
      skillsTarget: profile.skillsTarget
    });
  } catch (err) {
    return errorResponse(res, `Failed to retrieve skills: ${err.message}`, [], 500);
  }
});

// 5. Update Skills Inventory
router.put("/skills", authMiddleware, async (req, res) => {
  const { possessed, target } = req.body;

  try {
    const profile = await careerService.updateSkills(req.user._id || req.user.id, possessed, target);
    return successResponse(res, "Skills profile updated successfully.", {
      skillsPossessed: profile.skillsPossessed,
      skillsTarget: profile.skillsTarget
    });
  } catch (err) {
    return errorResponse(res, `Failed to update skills: ${err.message}`, [], 500);
  }
});

module.exports = router;
