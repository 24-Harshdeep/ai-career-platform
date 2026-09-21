/**
 * Normalizes company, title, and location into a canonical deduplication key.
 */
function getDeduplicationKey(job) {
  const normCompany = (job.company?.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const normTitle = (job.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const isRemote = Boolean(job.location?.remote);
  const normLoc = isRemote ? "remote" : (job.location?.raw || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  return `${normCompany}:${normTitle}:${normLoc}`;
}

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

      // Merge sources
      const mergedSources = Array.from(new Set([...(existing.sources || []), job.source || job.provider]));
      existing.sources = mergedSources;

      // Prefer earlier published date if valid
      if (!existing.publishedAt && job.publishedAt) {
        existing.publishedAt = job.publishedAt;
      } else if (existing.publishedAt && job.publishedAt && job.publishedAt < existing.publishedAt) {
        existing.publishedAt = job.publishedAt;
      }

      // Prefer direct company boards over aggregators for canonical URL
      const isAggregator = existing.provider === "adzuna";
      const isDirectBoard = job.provider === "greenhouse" || job.provider === "lever" || job.provider === "ashby";

      if (isAggregator && isDirectBoard) {
        existing.url = job.url;
        existing.provider = job.provider;
        existing.source = job.source;
      }

      // Merge skills
      const mergedSkills = Array.from(new Set([...(existing.skills || []), ...(job.skills || [])]));
      existing.skills = mergedSkills;
    }
  }

  return Array.from(jobMap.values());
}

module.exports = {
  getDeduplicationKey,
  deduplicateJobs
};
