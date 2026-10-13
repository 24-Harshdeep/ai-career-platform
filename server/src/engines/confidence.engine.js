/**
 * Authoritative CareerOS Confidence Score Engine.
 * Evaluates candidate confidence derived from interview performance, project evidence,
 * skill matrix verification, and learning consistency.
 */
function calculateConfidenceScore(input) {
  const { interviewMetrics = {}, projectsCount = 0, totalSkillsCount = 0, streakDays = 0 } = input;

  const interviewPerformance = interviewMetrics.confidenceScore || (interviewMetrics.completedCount > 0 ? Math.min(100, interviewMetrics.averageScore || 70) : 60);
  const projectEvidence = projectsCount > 0 ? Math.min(100, projectsCount * 25) : 35;
  const skillEvidence = totalSkillsCount > 0 ? Math.min(100, totalSkillsCount * 10) : 45;
  const learningConsistency = streakDays ? Math.min(100, streakDays * 15 + 30) : 40;

  const contributors = {
    interviewPerformance,
    projectEvidence,
    skillEvidence,
    learningConsistency
  };

  const score = Math.round(
    (interviewPerformance * 0.35) +
    (projectEvidence * 0.25) +
    (skillEvidence * 0.25) +
    (learningConsistency * 0.15)
  );

  return {
    confidence: Math.min(100, Math.max(0, score)),
    contributors
  };
}

module.exports = { calculateConfidenceScore };
