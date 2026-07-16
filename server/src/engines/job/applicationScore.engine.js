const { projectReadinessTimeline } = require("./readiness.engine");

function calculateApplicationScore(resumeGap, projectGap, keywordMatch, experienceFit, salaryFit) {
  const overallScore = Math.round(
    resumeGap.score * 0.25 +
    projectGap.score * 0.25 +
    keywordMatch.score * 0.30 +
    experienceFit * 0.10 +
    salaryFit * 0.10
  );

  const recommendation = overallScore >= 80 ? "Apply Now" : "Wait";

  const nextActions = [];
  const skillGaps = [];

  if (resumeGap.missing && resumeGap.missing.length > 0) {
    resumeGap.missing.slice(0, 2).forEach(skill => {
      nextActions.push({
        gap: `Missing Resume Keyword: ${skill}`,
        evidence: `Not found in parsed resume text.`,
        priority: "High",
        expectedImpact: 3
      });
      skillGaps.push(skill);
    });
  }

  if (projectGap.missing && projectGap.missing.length > 0) {
    projectGap.missing.slice(0, 2).forEach(practice => {
      nextActions.push({
        gap: `Missing Project Evidence: ${practice}`,
        evidence: `No codebase configurations detected.`,
        priority: "High",
        expectedImpact: 4
      });
    });
  }

  const daysToReady = projectReadinessTimeline(nextActions.length);

  return {
    matchScore: Math.min(100, overallScore),
    resumeScore: resumeGap.score,
    githubScore: keywordMatch.score,
    portfolioScore: projectGap.score,
    experienceGap: experienceFit >= 80 ? "Matched" : "Experience level mismatch",
    salaryFit,
    recommendation,
    nextActions,
    skillGap: skillGaps,
    daysToReady
  };
}

module.exports = { calculateApplicationScore };
