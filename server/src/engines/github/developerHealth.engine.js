function evaluateDeveloperHealth(repos, analyses) {
  if (!repos || repos.length === 0) {
    return {
      overallHealth: 80,
      engineeringLevel: "Intermediate",
      repositoryCount: 0,
      bestRepository: "",
      weakestRepository: "",
      languageDistribution: { Frontend: 50, Backend: 40, Database: 10, DevOps: 0 },
      missingPractices: [],
      strengths: ["Frontend UI design", "Modern TypeScript interfaces"],
      weaknesses: ["Automated testing coverages", "DevOps pipeline integrations"],
      recommendedProjects: ["Implement unit test suites and add Docker setups to your backend servers."],
      nextActions: ["Upload a LICENSE to your primary repository."]
    };
  }

  let totalHealth = 0;
  let totalTest = 0;
  let bestRepoName = "";
  let bestRepoScore = -1;
  let worstRepoName = "";
  let worstRepoScore = 101;
  
  const allMissingPractices = new Set();

  analyses.forEach((analysis) => {
    totalHealth += analysis.healthScore;
    totalTest += analysis.testingScore || 50;

    const repo = repos.find(r => r._id.toString() === analysis.repositoryId.toString() || r.id === analysis.repositoryId);
    const repoName = repo ? repo.name : "repo";

    if (analysis.healthScore > bestRepoScore) {
      bestRepoScore = analysis.healthScore;
      bestRepoName = repoName;
    }
    if (analysis.healthScore < worstRepoScore) {
      worstRepoScore = analysis.healthScore;
      worstRepoName = repoName;
    }

    (analysis.missingPractices || []).forEach(p => allMissingPractices.add(`${repoName}: ${p}`));
  });

  const overallHealth = Math.round(totalHealth / analyses.length);
  const avgTest = Math.round(totalTest / analyses.length);

  let engineeringLevel = "Intermediate";
  if (overallHealth >= 85 && avgTest >= 75) {
    engineeringLevel = "Advanced";
  } else if (overallHealth < 65) {
    engineeringLevel = "Beginner";
  }

  const strengths = [];
  const weaknesses = [];
  const recommendedProjects = [];
  const nextActions = [];

  // Determine strengths & weaknesses based on scores
  if (overallHealth >= 80) strengths.push("Strong structural consistency across projects");
  if (avgTest < 60) {
    weaknesses.push("Low unit testing coverage across repositories");
    nextActions.push(`Write Jest test suites for ${worstRepoName}`);
  } else {
    strengths.push("Good automated testing integration");
  }

  const hasMissingIgnore = Array.from(allMissingPractices).some(p => p.toLowerCase().includes("gitignore"));
  if (hasMissingIgnore) {
    weaknesses.push("Missing project ignore configurations (.gitignore)");
    nextActions.push("Verify ignore files are uploaded to protect credential leaks");
  }

  const hasMissingDocker = Array.from(allMissingPractices).some(p => p.toLowerCase().includes("docker"));
  if (hasMissingDocker) {
    weaknesses.push("Missing DevOps containerization support");
    recommendedProjects.push("Create a containerized deployment setup (Docker composition)");
  }

  // Fallbacks if lists are empty
  if (strengths.length === 0) strengths.push("Codebase organization consistency");
  if (weaknesses.length === 0) weaknesses.push("Cloud deployments triggers");
  if (recommendedProjects.length === 0) {
    recommendedProjects.push("Build a Full Stack deployment boilerplate featuring automated GitHub pipelines.");
  }
  if (nextActions.length === 0) {
    nextActions.push(`Verify environment example config exists in ${bestRepoName}`);
  }

  return {
    overallHealth,
    engineeringLevel,
    repositoryCount: repos.length,
    bestRepository: bestRepoName,
    weakestRepository: worstRepoName,
    missingPractices: Array.from(allMissingPractices).slice(0, 5),
    strengths,
    weaknesses,
    recommendedProjects,
    nextActions
  };
}

module.exports = { evaluateDeveloperHealth };
