/**
 * Feature Extractor for CareerOS Machine Learning Pipeline
 * Transforms normalized CareerContext into a 6-dimensional numerical feature vector.
 */

function extractFeatureVector(context) {
  if (!context) {
    return [0, 0, 0, 0, 0, 0];
  }

  // Feature 1: Resume ATS Score (0 - 1.0)
  const atsScore = Math.min(Math.max((context.resumeScore || 0) / 100, 0), 1);

  // Feature 2: GitHub Engineering Health (0 - 1.0)
  const githubHealth = Math.min(Math.max((context.githubHealth || 0) / 100, 0), 1);

  // Feature 3: Target Skill Coverage Ratio (0 - 1.0)
  const targetSkills = context.skillsTarget || [];
  const possessedSkills = context.skillsPossessed || {};
  const allPossessed = [
    ...(possessedSkills.languages || []),
    ...(possessedSkills.frameworks || []),
    ...(possessedSkills.backend || []),
    ...(possessedSkills.frontend || []),
    ...(possessedSkills.database || []),
    ...(possessedSkills.tools || [])
  ];

  let skillCoverage = 0.5; // default fallback if no target set
  if (targetSkills.length > 0) {
    const matchCount = targetSkills.filter(s => 
      allPossessed.some(p => p.toLowerCase().includes(s.toLowerCase()))
    ).length;
    skillCoverage = matchCount / targetSkills.length;
  } else if (allPossessed.length > 0) {
    skillCoverage = Math.min(allPossessed.length / 10, 1.0);
  }

  // Feature 4: Interview Performance Average (0 - 1.0)
  const interviewScore = Math.min(Math.max((context.interviewScore || 0) / 100, 0), 1);

  // Feature 5: Consistency Streak (Normalized, max 30 days -> 1.0)
  const streakNormalized = Math.min((context.userStreak || 0) / 30, 1.0);

  // Feature 6: Verified Project Evidence Count (Normalized, max 5 projects -> 1.0)
  const projectCount = Math.min((context.projectsCount || (context.projects || []).length || 0) / 5, 1.0);

  return [atsScore, githubHealth, skillCoverage, interviewScore, streakNormalized, projectCount];
}

const FEATURE_NAMES = [
  "atsScore",
  "githubHealth",
  "skillCoverage",
  "interviewScore",
  "streakNormalized",
  "projectCount"
];

module.exports = {
  extractFeatureVector,
  FEATURE_NAMES
};
