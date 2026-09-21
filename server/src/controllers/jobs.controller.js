const jobDiscoveryService = require("../services/jobDiscovery.service");

// Standardized JSON Envelopes
const successResponse = (res, message, data) => res.json({ success: true, message, data });
const errorResponse = (res, message, errors = [], status = 400) => res.status(status).json({ success: false, message, errors });

// 1. Search & Discover Jobs
async function searchJobs(req, res) {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const result = await jobDiscoveryService.searchJobs(userId, req.query);
    return successResponse(res, "Jobs fetched successfully.", result);
  } catch (err) {
    console.error("[JobsController] Error in searchJobs:", err);
    return errorResponse(res, `Failed to search jobs: ${err.message}`, [], 500);
  }
}

// 2. Fetch Saved Jobs
async function getSavedJobs(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const jobs = await jobDiscoveryService.getSavedJobs(userId);
    return successResponse(res, "Saved jobs retrieved successfully.", jobs);
  } catch (err) {
    console.error("[JobsController] Error in getSavedJobs:", err);
    return errorResponse(res, `Failed to fetch saved jobs: ${err.message}`, [], 500);
  }
}

// 3. Fetch Single Job Details
async function getJobById(req, res) {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const job = await jobDiscoveryService.getJobById(userId, req.params.id);
    if (!job) {
      return errorResponse(res, "Job not found.", [], 404);
    }
    return successResponse(res, "Job details retrieved successfully.", job);
  } catch (err) {
    console.error("[JobsController] Error in getJobById:", err);
    return errorResponse(res, `Failed to fetch job details: ${err.message}`, [], 500);
  }
}

// 4. Save Job
async function saveJob(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const app = await jobDiscoveryService.saveJob(userId, req.params.id);
    return successResponse(res, "Job saved successfully.", app);
  } catch (err) {
    console.error("[JobsController] Error in saveJob:", err);
    return errorResponse(res, `Failed to save job: ${err.message}`, [], 500);
  }
}

// 5. Unsave Job
async function unsaveJob(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    await jobDiscoveryService.unsaveJob(userId, req.params.id);
    return successResponse(res, "Job unsaved successfully.", null);
  } catch (err) {
    console.error("[JobsController] Error in unsaveJob:", err);
    return errorResponse(res, `Failed to unsave job: ${err.message}`, [], 500);
  }
}

// 6. Update Application Status & Notes
async function updateApplicationStatus(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    const { status, notes } = req.body;
    if (!status) {
      return errorResponse(res, "Missing parameter: 'status' is required.");
    }
    const app = await jobDiscoveryService.updateApplicationStatus(userId, req.params.id, status, notes);
    return successResponse(res, "Application status updated successfully.", app);
  } catch (err) {
    console.error("[JobsController] Error in updateApplicationStatus:", err);
    return errorResponse(res, `Failed to update application status: ${err.message}`, [], 500);
  }
}

module.exports = {
  searchJobs,
  getSavedJobs,
  getJobById,
  saveJob,
  unsaveJob,
  updateApplicationStatus
};
