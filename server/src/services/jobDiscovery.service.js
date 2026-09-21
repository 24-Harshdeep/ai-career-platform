const Job = require("../models/Job");
const JobApplication = require("../models/JobApplication");
const { getEnabledProviders } = require("../providers");
const { normalizeJob } = require("./jobNormalizer.service");
const { deduplicateJobs } = require("./jobDeduplicator.service");
const { evaluateJobMatch } = require("./jobMatching.service");
const { getCareerContext } = require("./careerContext.service");

/**
 * Searches and discovers jobs across enabled providers & MongoDB cache.
 */
async function searchJobs(userId, query = {}) {
  const {
    q = "",
    location = "",
    remote = false,
    experienceLevel = "",
    employmentType = "",
    provider = "",
    postedWithin = "",
    page = 1,
    limit = 20,
    sort = "newest"
  } = query;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));

  // Load User Career Context for Matching & Role Auto-Defaulting
  let candidateContext = {};
  let userApplicationsMap = new Map();

  if (userId) {
    try {
      candidateContext = await getCareerContext(userId);
      const userApps = await JobApplication.find({ userId }).lean();
      userApps.forEach((app) => userApplicationsMap.set(app.jobId.toString(), app));
    } catch (err) {
      console.error("[JobDiscoveryService] Failed to load user candidate context:", err.message);
    }
  }

  // Auto-default search query to user's configured target role if query parameter is empty
  const searchQuery = (q && q.trim()) ? q.trim() : (candidateContext.targetRole || "");

  // 1. Fetch from external providers in parallel with failure isolation
  const enabledProviders = getEnabledProviders();
  const providerStatusMap = {};

  const providerPromises = enabledProviders.map(async (p) => {
    try {
      const rawJobs = await p.searchJobs({ q: searchQuery, location, remote: Boolean(remote), page: pageNum, limit: limitNum });
      providerStatusMap[p.name] = "success";
      return rawJobs;
    } catch (err) {
      console.error(`[JobDiscoveryService] Provider '${p.name}' failed:`, err.message);
      providerStatusMap[p.name] = "failed";
      return [];
    }
  });

  const providerResults = await Promise.allSettled(providerPromises);
  let fetchedRawJobs = [];

  providerResults.forEach((res) => {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      fetchedRawJobs.push(...res.value);
    }
  });

  // 2. Normalize and Deduplicate fetched jobs
  if (fetchedRawJobs.length > 0) {
    const normalizedJobs = fetchedRawJobs.map(normalizeJob);
    const deduplicated = deduplicateJobs(normalizedJobs);

    // Upsert into MongoDB
    const bulkOps = deduplicated.map((j) => ({
      updateOne: {
        filter: { hash: j.hash },
        update: { $set: j },
        upsert: true
      }
    }));

    try {
      await Job.bulkWrite(bulkOps, { ordered: false });
    } catch (dbErr) {
      console.error("[JobDiscoveryService] Bulk DB upsert error:", dbErr.message);
    }
  }

  // 3. Build MongoDB query filter
  const filter = {};

  if (searchQuery) {
    const regex = new RegExp(searchQuery.trim(), "i");
    filter.$or = [
      { title: regex },
      { description: regex },
      { "company.name": regex },
      { skills: regex }
    ];
  }

  if (location) {
    filter["location.raw"] = new RegExp(location.trim(), "i");
  }

  if (remote === "true" || remote === true) {
    filter["location.remote"] = true;
  }

  if (experienceLevel) {
    filter.experienceLevel = experienceLevel;
  }

  if (employmentType) {
    filter.employmentType = employmentType;
  }

  if (provider) {
    filter.provider = provider;
  }

  // Handle Recent Jobs Date Filtering using publishedAt
  if (postedWithin) {
    const now = new Date();
    let cutoffDate = null;

    if (postedWithin === "24h") cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    else if (postedWithin === "3d") cutoffDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    else if (postedWithin === "7d") cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (postedWithin === "14d") cutoffDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    else if (postedWithin === "30d") cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (cutoffDate) {
      filter.publishedAt = { $gte: cutoffDate };
    }
  }

  // Fetch jobs from DB
  let dbJobs = await Job.find(filter).lean();

  // Re-use loaded User Career Context for Matching if not loaded
  if (userId && (!candidateContext || !candidateContext.userId)) {
    try {
      candidateContext = await getCareerContext(userId);
      const userApps = await JobApplication.find({ userId }).lean();
      userApps.forEach((app) => userApplicationsMap.set(app.jobId.toString(), app));
    } catch (err) {
      console.error("[JobDiscoveryService] Failed to load user candidate context:", err.message);
    }
  }

  // 4. Attach Match Evaluation & User Saved/Application Status to each Job
  const enrichedJobs = dbJobs.map((j) => {
    const matchData = evaluateJobMatch(candidateContext, j);
    const userApp = userApplicationsMap.get(j._id.toString());

    return {
      ...j,
      id: j._id.toString(),
      match: matchData,
      isSaved: Boolean(userApp),
      applicationStatus: userApp ? userApp.status : null,
      savedAt: userApp ? userApp.savedAt : null
    };
  });

  // 5. Apply Sorting
  if (sort === "match") {
    enrichedJobs.sort((a, b) => b.match.matchScore - a.match.matchScore);
  } else if (sort === "relevance") {
    enrichedJobs.sort((a, b) => (b.match.matchScore * 0.7) + ((b.publishedAt ? b.publishedAt.getTime() : 0) * 0.3));
  } else {
    // default: newest first (prioritize publishedAt then fetchedAt)
    enrichedJobs.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.fetchedAt).getTime();
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.fetchedAt).getTime();
      return dateB - dateA;
    });
  }

  // Paginate
  const total = enrichedJobs.length;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const paginatedJobs = enrichedJobs.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return {
    jobs: paginatedJobs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages
    },
    providersStatus: providerStatusMap
  };
}

/**
 * Fetch detailed view for a single job with user candidate match analysis
 */
async function getJobById(userId, jobId) {
  const job = await Job.findById(jobId).lean();
  if (!job) return null;

  let candidateContext = {};
  let userApp = null;

  if (userId) {
    try {
      candidateContext = await getCareerContext(userId);
      userApp = await JobApplication.findOne({ userId, jobId }).lean();
    } catch (err) {
      console.error("[JobDiscoveryService] Failed to load user context for single job view:", err.message);
    }
  }

  const matchData = evaluateJobMatch(candidateContext, job);

  return {
    ...job,
    id: job._id.toString(),
    match: matchData,
    isSaved: Boolean(userApp),
    applicationStatus: userApp ? userApp.status : null,
    notes: userApp ? userApp.notes : "",
    savedAt: userApp ? userApp.savedAt : null
  };
}

/**
 * Toggle Save / Unsave a job for candidate
 */
async function saveJob(userId, jobId) {
  const job = await Job.findById(jobId);
  if (!job) throw new Error("Job opportunity not found.");

  const app = await JobApplication.findOneAndUpdate(
    { userId, jobId },
    { $setOnInsert: { status: "Saved", savedAt: new Date() } },
    { upsert: true, new: true }
  );

  return app;
}

async function unsaveJob(userId, jobId) {
  await JobApplication.deleteOne({ userId, jobId, status: "Saved" });
  return true;
}

/**
 * Fetch candidate's saved jobs list
 */
async function getSavedJobs(userId) {
  const savedApps = await JobApplication.find({ userId }).populate("jobId").lean();

  let candidateContext = {};
  try {
    candidateContext = await getCareerContext(userId);
  } catch (e) {}

  return savedApps
    .filter((app) => app.jobId)
    .map((app) => {
      const j = app.jobId;
      const matchData = evaluateJobMatch(candidateContext, j);
      return {
        ...j,
        id: j._id.toString(),
        match: matchData,
        isSaved: true,
        applicationStatus: app.status,
        savedAt: app.savedAt,
        notes: app.notes
      };
    });
}

/**
 * Update candidate application tracking stage (Saved, Applied, Interview, Offer, Rejected)
 */
async function updateApplicationStatus(userId, jobId, status, notes = "") {
  const allowed = ["Saved", "Applied", "Interview", "Offer", "Rejected"];
  if (!allowed.includes(status)) {
    throw new Error(`Invalid status '${status}'. Must be one of: ${allowed.join(", ")}`);
  }

  const updateFields = { status, notes };
  if (status === "Applied") {
    updateFields.appliedAt = new Date();
  }

  const app = await JobApplication.findOneAndUpdate(
    { userId, jobId },
    { $set: updateFields, $setOnInsert: { savedAt: new Date() } },
    { upsert: true, new: true }
  );

  return app;
}

module.exports = {
  searchJobs,
  getJobById,
  saveJob,
  unsaveJob,
  getSavedJobs,
  updateApplicationStatus
};
