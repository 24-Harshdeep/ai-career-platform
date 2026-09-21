const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const jobsController = require("../controllers/jobs.controller");

// Helper middleware for optional authentication (extracts user if valid token present, allows unauthenticated search)
const optionalAuthMiddleware = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    req.user = null;
    return next();
  }

  try {
    await authMiddleware(req, res, next);
  } catch (err) {
    req.user = null;
    return next();
  }
};

// 1. Search & Discover Jobs
router.get("/", optionalAuthMiddleware, jobsController.searchJobs);

// 2. Candidate Saved Jobs
router.get("/saved", authMiddleware, jobsController.getSavedJobs);

// 3. Single Job Details & Match Breakdown
router.get("/:id", optionalAuthMiddleware, jobsController.getJobById);

// 4. Save Job
router.post("/:id/save", authMiddleware, jobsController.saveJob);

// 5. Unsave Job
router.delete("/:id/save", authMiddleware, jobsController.unsaveJob);

// 6. Update Application Status & Notes
router.post("/:id/application", authMiddleware, jobsController.updateApplicationStatus);
router.put("/:id/application", authMiddleware, jobsController.updateApplicationStatus);

module.exports = router;
