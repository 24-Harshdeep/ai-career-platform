function calculateProjectScore(perf, access, seo, techEvidence, hasReadme) {
  const perfScore = perf.score;
  const accessScore = access.score;
  const seoScore = seo.score;

  // Calculate technology evidence score out of 100
  const flags = techEvidence.technologyEvidence;
  const activeCount = Object.values(flags).filter(Boolean).length;
  const techScore = Math.round((activeCount / Object.keys(flags).length) * 100);

  const docScore = hasReadme ? 95 : 40;
  const deployScore = 90; // baseline verified deploy

  const overallScore = Math.round(
    perfScore * 0.15 +
    accessScore * 0.15 +
    seoScore * 0.15 +
    techScore * 0.35 +
    docScore * 0.10 +
    deployScore * 0.10
  );

  const missingPractices = [];
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  // Formulate checklist arrays
  if (!flags.hasAuth) {
    missingPractices.push("Missing authentication layers (JWT/OAuth)");
    weaknesses.push("Unprotected backend endpoints");
    recommendations.push("Implement a robust authentication middleware protecting database endpoints.");
  } else {
    strengths.push("Secure authorization sessions configured");
  }

  if (!flags.hasDatabase) {
    missingPractices.push("Missing database models");
    weaknesses.push("Volatile in-memory variables arrays usage");
    recommendations.push("Connect a MongoDB Atlas database to persist state.");
  } else {
    strengths.push("Structured database mapping schemas established");
  }

  if (!flags.hasTesting) {
    missingPractices.push("Missing unit test suites");
    weaknesses.push("Untested routing controller code");
    recommendations.push("Add Jest unit tests for core express router paths.");
  } else {
    strengths.push("Good test coverage patterns verified");
  }

  if (perfScore >= 85) strengths.push("Optimized page loading performance index");
  if (accessScore >= 85) strengths.push("Strong accessibility standards ARIA compliance");

  // Fallbacks if empty
  if (strengths.length === 0) strengths.push("Clean project codebase layout");
  if (weaknesses.length === 0) weaknesses.push("Cloud deployments optimizations");
  if (recommendations.length === 0) {
    recommendations.push("Expand automated CI/CD pipeline triggers (GitHub Actions workflows).");
  }

  return {
    overallScore: Math.min(100, overallScore),
    performanceScore: perfScore,
    accessibilityScore: accessScore,
    seoScore: seoScore,
    documentationScore: docScore,
    architectureScore: techScore,
    deploymentScore: deployScore,
    missingPractices,
    strengths,
    weaknesses,
    recommendations,
    careerImpact: 4,
    jobReadinessImpact: 6
  };
}

module.exports = { calculateProjectScore };
