function toDeveloperIntelligenceDTO(profile, repos, analyses) {
  if (!profile) return null;

  const repoList = (repos || []).map(repo => {
    const analysis = (analyses || []).find(a => 
      a.repositoryId.toString() === repo._id.toString() || a.repositoryId === repo.id
    );
    return {
      id: repo._id || repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.url,
      language: repo.primaryLanguage,
      stars: repo.stars,
      forks: repo.forks,
      healthScore: analysis?.healthScore ?? null,
      documentationScore: analysis?.documentationScore ?? null,
      testingScore: analysis?.testingScore ?? null,
      architectureScore: analysis?.architectureScore ?? null,
      activityScore: analysis?.activityScore ?? null,
      maintainabilityScore: analysis?.maintainabilityScore ?? null,
      securityScore: analysis?.securityScore ?? null
    };
  });

  const languageMap = {};
  if (profile.languageDistribution) {
    if (typeof profile.languageDistribution.forEach === "function") {
      profile.languageDistribution.forEach((val, key) => {
        languageMap[key] = val;
      });
    } else {
      Object.assign(languageMap, profile.languageDistribution);
    }
  }

  // Calculate dynamic technology coverage from repository characteristics
  let frontendCount = 0;
  let backendCount = 0;
  let databaseCount = 0;
  let devopsCount = 0;
  let totalCount = 0;

  (repos || []).forEach(repo => {
    const lang = (repo.primaryLanguage || "").toLowerCase();
    totalCount++;
    if (["typescript", "javascript", "html", "css", "scss"].includes(lang)) {
      frontendCount++;
    } else if (["go", "python", "ruby", "php", "java", "c#", "rust", "c++", "c"].includes(lang)) {
      backendCount++;
    } else if (["sql", "plsql"].includes(lang)) {
      databaseCount++;
    } else if (["dockerfile", "shell", "hcl", "yaml", "makefile"].includes(lang)) {
      devopsCount++;
    } else {
      // General fallback based on repository name keywords
      const name = repo.name.toLowerCase();
      if (name.includes("client") || name.includes("frontend") || name.includes("ui") || name.includes("web")) {
        frontendCount++;
      } else if (name.includes("server") || name.includes("backend") || name.includes("api") || name.includes("service")) {
        backendCount++;
      } else if (name.includes("db") || name.includes("sql") || name.includes("mongo")) {
        databaseCount++;
      } else if (name.includes("docker") || name.includes("ci") || name.includes("cd") || name.includes("devops") || name.includes("infra")) {
        devopsCount++;
      } else {
        backendCount++; // Default fallback
      }
    }
  });

  const frontendPct = totalCount > 0 ? Math.round((frontendCount / totalCount) * 100) : null;
  const backendPct = totalCount > 0 ? Math.round((backendCount / totalCount) * 100) : null;
  const databasePct = totalCount > 0 ? Math.round((databaseCount / totalCount) * 100) : null;
  const devopsPct = totalCount > 0 ? Math.round((devopsCount / totalCount) * 100) : 0;

  return {
    overallHealth: profile.overallHealth,
    engineeringLevel: profile.engineeringLevel,
    repositoryCount: profile.repositoryCount || repoList.length,
    bestRepository: profile.bestRepository || "",
    weakestRepository: profile.weakestRepository || "",
    careerImpact: profile.careerImpact ?? null,
    jobReadinessImpact: profile.jobReadinessImpact ?? null,
    repositories: repoList,
    languageDistribution: languageMap,
    technologyCoverage: {
      Frontend: frontendPct,
      Backend: backendPct,
      Database: databasePct,
      DevOps: devopsPct
    },
    missingPractices: profile.missingPractices || [],
    strengths: [],
    weaknesses: [],
    recommendedProjects: [],
    nextActions: []
  };
}

module.exports = { toDeveloperIntelligenceDTO };
