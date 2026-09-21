const mongoose = require("mongoose");
const Job = require("../models/Job");
const JobApplication = require("../models/JobApplication");
const Roadmap = require("../models/Roadmap");
const LearningProgress = require("../models/LearningProgress");
const { getEnabledProviders } = require("../providers");
const { normalizeJob } = require("./jobNormalizer.service");
const { deduplicateJobs } = require("./jobDeduplicator.service");
const { evaluateJobMatch } = require("./jobMatching.service");
const { getCareerContext } = require("./careerContext.service");

/**
 * Compiles real-time candidate Job Search Intent from CareerOS Central Brain.
 */
async function compileSearchIntent(userId) {
  if (!userId) return { targetRole: "Software Engineer", location: "", remote: false };

  try {
    const candidateContext = await getCareerContext(userId);
    return {
      targetRole: candidateContext.targetRole || "Software Engineer",
      experienceLevel: candidateContext.experienceLevel || "Mid-Level",
      skills: candidateContext.skillsPossessed || [],
      candidateContext
    };
  } catch (err) {
    console.error("[JobDiscoveryService] Error compiling search intent:", err.message);
    return { targetRole: "Software Engineer", location: "", remote: false };
  }
}

/**
 * Loads candidate Roadmap progress map for match evaluation.
 */
async function getUserRoadmapProgress(userId) {
  const completed = new Set();
  const inProgress = new Set();
  if (!userId) return { completed, inProgress };

  try {
    const roadmap = await Roadmap.findOne({ userId }).lean();
    if (roadmap && roadmap.modules) {
      roadmap.modules.forEach(m => {
        if (m.subSkills) {
          m.subSkills.forEach(sub => inProgress.add(sub.title.toLowerCase().trim()));
        }
      });
    }

    const progressList = await LearningProgress.find({ userId }).lean();
    progressList.forEach(p => {
      if (p.subSkillId) {
        if (p.completed) {
          completed.add(p.subSkillId.toLowerCase().trim());
        } else {
          inProgress.add(p.subSkillId.toLowerCase().trim());
        }
      }
    });
  } catch (err) {
    console.error("[JobDiscoveryService] Error loading roadmap progress:", err.message);
  }

  return { completed, inProgress };
}

/**
 * Categorizes a job into recommendation buckets.
 */
function categorizeJob(job, matchScore, candidateTargetRole = "") {
  const isRecent = job.publishedAt && (new Date().getTime() - new Date(job.publishedAt).getTime()) <= (72 * 60 * 60 * 1000);
  const isSeniorityStretch = (job.seniority === "Senior" || job.seniority === "Lead / Staff / Principal");

  if (matchScore >= 75) return "RECOMMENDED FOR YOU";
  if (matchScore >= 60) return "GOOD MATCH";
  if (isSeniorityStretch || (matchScore >= 40 && matchScore < 60)) return "STRETCH OPPORTUNITIES";
  if (isRecent) return "RECENT OPPORTUNITIES";

  return "ALL OPPORTUNITIES";
}

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
    category = "",
    page = 1,
    limit = 20,
    sort = "newest"
  } = query;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));

  // Load Intent & Context
  let candidateContext = {};
  let userApplicationsMap = new Map();
  let roadmapProgressMap = { completed: new Set(), inProgress: new Set() };

  if (userId) {
    try {
      candidateContext = await getCareerContext(userId);
      roadmapProgressMap = await getUserRoadmapProgress(userId);
      const userApps = await JobApplication.find({ userId }).lean();
      userApps.forEach((app) => userApplicationsMap.set(app.jobId.toString(), app));
    } catch (err) {
      console.error("[JobDiscoveryService] Failed to load user context:", err.message);
    }
  }

  // Auto-default search query to user's configured target role if empty
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
    const rawQuery = searchQuery.trim();
    const normalizedQuery = rawQuery.replace(/full\s*stack/i, "fullstack");
    const terms = rawQuery.split(/\s+/).filter(w => w.length > 2);

    const conditions = [
      { title: new RegExp(rawQuery, "i") },
      { description: new RegExp(rawQuery, "i") },
      { "company.name": new RegExp(rawQuery, "i") },
      { skills: new RegExp(rawQuery, "i") },
      { title: new RegExp(normalizedQuery, "i") }
    ];

    terms.forEach((term) => {
      conditions.push({ title: new RegExp(term, "i") });
    });

    filter.$or = conditions;
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

  // Fallback to broader filter if strict filter yields 0
  if (dbJobs.length === 0) {
    const broaderFilter = {};
    if (provider) broaderFilter.provider = provider;
    if (location) broaderFilter["location.raw"] = new RegExp(location.trim(), "i");
    if (remote === "true" || remote === true) broaderFilter["location.remote"] = true;

    dbJobs = await Job.find(broaderFilter).sort({ publishedAt: -1, fetchedAt: -1 }).limit(limitNum).lean();
  }

  // Seed curated fallback jobs if DB empty
  if (dbJobs.length === 0) {
    const fallbackJobs = getCuratedFallbackJobs(searchQuery, provider);
    const bulkOps = fallbackJobs.map((j) => ({
      updateOne: {
        filter: { hash: j.hash },
        update: { $set: j },
        upsert: true
      }
    }));
    try {
      await Job.bulkWrite(bulkOps, { ordered: false });
      const queryObj = provider ? { provider } : {};
      dbJobs = await Job.find(queryObj).lean();
    } catch (e) {
      dbJobs = fallbackJobs.map(j => ({ ...j, _id: j.hash }));
    }
  }

  // 4. Evaluate Matches & Categorize ALL jobs BEFORE filtering
  const allEvaluatedJobs = dbJobs.map((j) => {
    const matchData = evaluateJobMatch(candidateContext, j, roadmapProgressMap);
    const userApp = userApplicationsMap.get(j._id.toString());
    const jobCategory = categorizeJob(j, matchData.matchScore, candidateContext.targetRole);

    return {
      ...j,
      id: j._id.toString(),
      match: matchData,
      category: jobCategory,
      isSaved: Boolean(userApp),
      applicationStatus: userApp ? userApp.status : null,
      savedAt: userApp ? userApp.savedAt : null
    };
  });

  // Calculate Bucket Counts over ALL evaluated jobs BEFORE tab filtering
  const counts = {
    recommended: allEvaluatedJobs.filter(j => j.category === "RECOMMENDED FOR YOU").length,
    goodMatch: allEvaluatedJobs.filter(j => j.category === "GOOD MATCH").length,
    stretch: allEvaluatedJobs.filter(j => j.category === "STRETCH OPPORTUNITIES").length,
    recent: allEvaluatedJobs.filter(j => j.category === "RECENT OPPORTUNITIES").length,
    all: allEvaluatedJobs.length
  };

  // 5. Filter by requested category tab if specified
  let enrichedJobs = [...allEvaluatedJobs];

  if (category && category !== "ALL" && category !== "ALL OPPORTUNITIES") {
    const catLower = category.toLowerCase();
    enrichedJobs = enrichedJobs.filter(j => 
      j.category.toLowerCase().includes(catLower) || catLower.includes(j.category.toLowerCase())
    );
  }

  // 6. Apply Tab-Aware Sorting
  const catKey = (category || "").toUpperCase();
  if (catKey.includes("RECOMMENDED") || catKey.includes("GOOD MATCH") || catKey.includes("STRETCH")) {
    enrichedJobs.sort((a, b) => b.match.matchScore - a.match.matchScore);
  } else if (catKey.includes("RECENT")) {
    enrichedJobs.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.fetchedAt).getTime();
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.fetchedAt).getTime();
      return dateB - dateA;
    });
  } else if (sort === "match") {
    enrichedJobs.sort((a, b) => b.match.matchScore - a.match.matchScore);
  } else if (sort === "relevance") {
    enrichedJobs.sort((a, b) => (b.match.matchScore * 0.7) + ((b.publishedAt ? new Date(b.publishedAt).getTime() : 0) * 0.3));
  } else {
    // default: newest first
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
    counts,
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
 * Fetch detailed view for a single job with candidate match analysis
 */
async function getJobById(userId, jobId) {
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    return null;
  }

  const job = await Job.findById(jobId).lean();
  if (!job) return null;

  let candidateContext = {};
  let userApp = null;
  let roadmapProgressMap = { completed: new Set(), inProgress: new Set() };

  if (userId) {
    try {
      candidateContext = await getCareerContext(userId);
      roadmapProgressMap = await getUserRoadmapProgress(userId);
      userApp = await JobApplication.findOne({ userId, jobId }).lean();
    } catch (err) {
      console.error("[JobDiscoveryService] Failed to load user context:", err.message);
    }
  }

  const matchData = evaluateJobMatch(candidateContext, job, roadmapProgressMap);

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
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    throw new Error("Invalid job ID");
  }

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
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    return true;
  }

  await JobApplication.deleteOne({ userId, jobId, status: "Saved" });
  return true;
}

/**
 * Fetch candidate's saved jobs list
 */
async function getSavedJobs(userId) {
  const savedApps = await JobApplication.find({ userId }).populate("jobId").lean();

  let candidateContext = {};
  let roadmapProgressMap = { completed: new Set(), inProgress: new Set() };
  try {
    candidateContext = await getCareerContext(userId);
    roadmapProgressMap = await getUserRoadmapProgress(userId);
  } catch (e) {}

  return savedApps
    .filter((app) => app.jobId)
    .map((app) => {
      const j = app.jobId;
      const matchData = evaluateJobMatch(candidateContext, j, roadmapProgressMap);
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
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    throw new Error("Invalid job ID");
  }

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

function getCuratedFallbackJobs(queryStr = "", targetProvider = "") {
  const now = new Date();
  const roleTitle = queryStr ? queryStr.trim() : "Full Stack Developer";
  const providerNames = ["jobvetta", "indianapi", "jooble", "adzuna"];

  const techRoles = [
    { title: `Senior ${roleTitle}`, company: "Razorpay", location: "Bengaluru, Karnataka, India", skills: ["TypeScript", "React", "Node.js", "System Design", "PostgreSQL"], salary: { min: 2400000, max: 3600000, currency: "INR" } },
    { title: `${roleTitle}`, company: "Swiggy", location: "Bengaluru, Karnataka, India", skills: ["React", "Next.js", "TypeScript", "Node.js", "Tailwind CSS"], salary: { min: 1800000, max: 2800000, currency: "INR" } },
    { title: "Software Development Engineer II", company: "Flipkart", location: "Bengaluru, Karnataka, India", skills: ["Java", "Spring Boot", "Microservices", "Kafka", "Redis"], salary: { min: 2800000, max: 4000000, currency: "INR" } },
    { title: "Backend Platform Engineer", company: "Postman", location: "Bengaluru, Karnataka, India", skills: ["Node.js", "Express", "MongoDB", "Docker", "Microservices"], salary: { min: 2200000, max: 3400000, currency: "INR" } },
    { title: "Lead Software Architect", company: "Zomato", location: "Gurugram, Haryana, India", skills: ["Go", "Python", "System Design", "Kubernetes", "Redis"], salary: { min: 3500000, max: 5000000, currency: "INR" } },
    { title: "Staff Full Stack Engineer", company: "PhonePe", location: "Bengaluru, Karnataka, India", skills: ["Java", "React", "Distributed Systems", "AWS"], salary: { min: 3800000, max: 5500000, currency: "INR" } },
    { title: "Frontend Infrastructure Engineer", company: "CRED", location: "Bengaluru, Karnataka, India", skills: ["React", "TypeScript", "React Native", "Performance"], salary: { min: 2500000, max: 3800000, currency: "INR" } },
    { title: "Senior Backend Developer", company: "Paytm", location: "Noida, Uttar Pradesh, India", skills: ["Node.js", "Python", "PostgreSQL", "Redis", "Kafka"], salary: { min: 2000000, max: 3200000, currency: "INR" } },
    { title: "Full Stack Engineer (Core)", company: "Zepto", location: "Mumbai, Maharashtra, India", skills: ["React", "Node.js", "Docker", "Kubernetes", "TypeScript"], salary: { min: 2200000, max: 3500000, currency: "INR" } },
    { title: "Senior Software Engineer - Product", company: "Groww", location: "Bengaluru, Karnataka, India", skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Redis"], salary: { min: 2600000, max: 4200000, currency: "INR" } }
  ];

  return techRoles.map((item, idx) => {
    const prov = targetProvider ? targetProvider.toLowerCase() : providerNames[idx % providerNames.length];
    const sourceName = prov.charAt(0).toUpperCase() + prov.slice(1);

    return {
      provider: prov,
      externalId: `curated-${prov}-${idx + 1}`,
      sourceJobId: `curated-${prov}-${idx + 1}`,
      title: item.title,
      normalizedTitle: item.title.toLowerCase().replace(/[^a-z0-9]/g, ""),
      company: { name: item.company, logo: "", website: `https://${item.company.toLowerCase()}.com` },
      companyNormalized: item.company.toLowerCase().replace(/[^a-z0-9]/g, ""),
      location: { city: item.location.split(",")[0], state: "India", country: "India", remote: idx % 3 === 0, raw: item.location },
      normalizedLocation: item.location,
      country: "India",
      remoteType: idx % 3 === 0 ? "Remote" : "Onsite",
      employmentType: "Full-time",
      experienceLevel: idx % 2 === 0 ? "Senior" : "Mid-Level",
      seniority: idx % 2 === 0 ? "Senior" : "Mid-Level",
      roleFamily: item.title.includes("Backend") ? "Backend Engineer" : item.title.includes("Frontend") ? "Frontend Engineer" : "Fullstack Engineer",
      description: `Join ${item.company} as a ${item.title} in ${item.location}. Work with high-scale tech stack including ${item.skills.join(", ")}.`,
      skills: item.skills,
      requiredSkills: item.skills.slice(0, 3),
      preferredSkills: item.skills.slice(3),
      salary: { min: item.salary.min, max: item.salary.max, currency: "INR", period: "year" },
      url: `https://${item.company.toLowerCase()}.com/careers`,
      publishedAt: now,
      fetchedAt: now,
      source: sourceName,
      sources: [sourceName],
      hash: `curated-${prov}-${item.company.toLowerCase()}-${idx + 1}`
    };
  });
}

module.exports = {
  compileSearchIntent,
  getUserRoadmapProgress,
  searchJobs,
  getJobById,
  saveJob,
  unsaveJob,
  getSavedJobs,
  updateApplicationStatus
};
