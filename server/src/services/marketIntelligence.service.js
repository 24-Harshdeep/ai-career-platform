const Job = require("../models/Job");
const { escapeRegex } = require("../utils/escapeRegex");

/**
 * Aggregates live market signals for a target role across recently ingested/fetched jobs.
 *
 * @param {string} targetRole - Target job title or role family (e.g. "Full Stack Developer")
 * @param {string} seniority - Optional seniority level (e.g. "Mid", "Senior")
 * @param {number} daysWindow - Days window to consider recent jobs (default: 30)
 * @returns {Promise<Object>} Aggregated market intelligence metrics
 */
async function getMarketIntelligence(targetRole = "Full Stack Developer", seniority = "", daysWindow = 30) {
  try {
    const cutoffDate = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000);
    const roleLower = escapeRegex((targetRole || "").trim().slice(0, 120).toLowerCase());

    const query = {
      $or: [
        { title: new RegExp(roleLower, "i") },
        { roleFamily: new RegExp(roleLower, "i") }
      ],
      fetchedAt: { $gte: cutoffDate }
    };

    if (seniority) {
      query.seniority = new RegExp(escapeRegex(seniority.trim().slice(0, 40)), "i");
    }

    let jobs = await Job.find(query).lean();

    // Fallback: broaden date filter if fewer than 5 jobs in window
    if (jobs.length < 5) {
      delete query.fetchedAt;
      jobs = await Job.find({
        $or: [
          { title: new RegExp(roleLower, "i") },
          { roleFamily: new RegExp(roleLower, "i") }
        ]
      }).sort({ fetchedAt: -1 }).limit(100).lean();
    }

    const sampleSize = jobs.length;
    if (sampleSize === 0) {
      return {
        sampleSize: 0,
        daysWindow,
        targetRole,
        topSkills: [],
        highDemand: [],
        growingDemand: [],
        marketGaps: []
      };
    }

    const skillCounts = new Map();

    jobs.forEach((job) => {
      const allJobSkills = new Set([
        ...(job.requiredSkills || []),
        ...(job.skills || []),
        ...(job.preferredSkills || [])
      ]);

      allJobSkills.forEach((rawSkill) => {
        const norm = rawSkill.trim();
        if (norm) {
          const lower = norm.toLowerCase();
          const existing = skillCounts.get(lower) || { name: norm, count: 0 };
          existing.count += 1;
          skillCounts.set(lower, existing);
        }
      });
    });

    const aggregatedSkills = Array.from(skillCounts.values())
      .map((item) => ({
        name: item.name,
        count: item.count,
        percentage: Math.round((item.count / sampleSize) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const highDemand = aggregatedSkills.filter((s) => s.percentage >= 50);
    const growingDemand = aggregatedSkills.filter((s) => s.percentage >= 25 && s.percentage < 50);

    return {
      sampleSize,
      daysWindow,
      targetRole,
      topSkills: aggregatedSkills.slice(0, 15),
      highDemand,
      growingDemand
    };
  } catch (err) {
    console.error("[MarketIntelligenceService] Error fetching market signals:", err.message);
    return {
      sampleSize: 0,
      daysWindow,
      targetRole,
      topSkills: [],
      highDemand: [],
      growingDemand: []
    };
  }
}

/**
 * Calculates candidate market gaps by comparing market signals against user possessed skills.
 */
function calculateMarketGaps(marketSignals, possessedSkillsSet = new Set()) {
  if (!marketSignals || !marketSignals.topSkills) return [];

  return marketSignals.topSkills
    .filter((s) => s.percentage >= 30 && !possessedSkillsSet.has(s.name.toLowerCase()))
    .map((s) => ({
      skill: s.name,
      marketDemandPct: s.percentage,
      relevance: s.percentage >= 50 ? "High Demand Market Signal" : "Growing Market Demand",
      sampleSize: marketSignals.sampleSize
    }));
}

module.exports = {
  getMarketIntelligence,
  calculateMarketGaps
};
