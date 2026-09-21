/**
 * Job Deduplicator Service
 * Merges job postings from multiple providers (Adzuna, IndianAPI, Jobvetta, Jooble, Greenhouse, Lever, Ashby)
 * using canonical identity matching (normalized company + title/roleFamily + location/remote).
 */

/**
 * Generates a canonical deduplication key for a job posting.
 */
function getDeduplicationKey(job) {
  const normCompany = job.companyNormalized || (job.company?.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const normTitle = job.normalizedTitle || (job.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const normLoc = (job.normalizedLocation || job.location?.raw || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const remoteTag = job.remoteType || (job.location?.remote ? "remote" : "onsite");

  return `${normCompany}:${job.roleFamily || normTitle}:${normLoc}:${remoteTag}`;
}

/**
 * Priority order for direct company job boards over aggregators.
 */
const PROVIDER_PRIORITY = {
  greenhouse: 10,
  lever: 10,
  ashby: 10,
  jobvetta: 8,
  indianapi: 7,
  jooble: 5,
  adzuna: 4,
  external: 1
};

/**
 * Deduplicates an array of normalized Job objects.
 * Merges source names into `sources` array and prefers direct application URLs.
 * 
 * @param {Array} jobs - List of normalized Job objects
 * @returns {Array} List of deduplicated canonical Job objects
 */
function deduplicateJobs(jobs = []) {
  if (!Array.isArray(jobs) || jobs.length === 0) return [];

  const jobMap = new Map();

  for (const job of jobs) {
    if (!job || !job.title || !job.url) continue;

    const key = getDeduplicationKey(job);

    if (!jobMap.has(key)) {
      const canonicalJob = {
        ...job,
        sources: Array.from(new Set([job.source || job.provider]))
      };
      jobMap.set(key, canonicalJob);
    } else {
      const existing = jobMap.get(key);

      // Merge sources array
      const mergedSources = Array.from(new Set([
        ...(existing.sources || []),
        job.source || job.provider
      ]));
      existing.sources = mergedSources;

      // Prefer earlier published date if valid
      if (!existing.publishedAt && job.publishedAt) {
        existing.publishedAt = job.publishedAt;
      } else if (existing.publishedAt && job.publishedAt && job.publishedAt < existing.publishedAt) {
        existing.publishedAt = job.publishedAt;
      }

      // Merge direct ATS URL if new job has higher priority provider
      const existingPriority = PROVIDER_PRIORITY[existing.provider?.toLowerCase()] || 0;
      const newPriority = PROVIDER_PRIORITY[job.provider?.toLowerCase()] || 0;

      if (newPriority > existingPriority) {
        existing.url = job.url;
        existing.provider = job.provider;
        existing.source = job.source;
        if (job.description && job.description.length > (existing.description || "").length) {
          existing.description = job.description;
        }
      }

      // Merge skills
      const mergedSkills = Array.from(new Set([...(existing.skills || []), ...(job.skills || [])]));
      const mergedReqSkills = Array.from(new Set([...(existing.requiredSkills || []), ...(job.requiredSkills || [])]));
      const mergedPrefSkills = Array.from(new Set([...(existing.preferredSkills || []), ...(job.preferredSkills || [])]));

      existing.skills = mergedSkills;
      existing.requiredSkills = mergedReqSkills;
      existing.preferredSkills = mergedPrefSkills;
    }
  }

  return Array.from(jobMap.values());
}

module.exports = {
  getDeduplicationKey,
  deduplicateJobs
};
