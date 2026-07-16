const { REPO_SCORING_WEIGHTS } = require("../../config/github/scoringWeights");

function calculateRepositoryScore(readme, testing, structure, activity) {
  const w = REPO_SCORING_WEIGHTS;

  const score = Math.round(
    readme.score * w.readme +
    testing.score * w.testing +
    structure.score * w.projectStructure +
    activity.activityScore * w.activity +
    80 * w.documentation +
    85 * w.maintainability
  );

  return {
    healthScore: Math.min(100, score),
    documentationScore: readme.score,
    testingScore: testing.score,
    architectureScore: structure.score,
    activityScore: activity.activityScore,
    maintainabilityScore: 82,
    securityScore: 88
  };
}

module.exports = { calculateRepositoryScore };
