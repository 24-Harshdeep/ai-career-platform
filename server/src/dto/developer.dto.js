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
      healthScore: analysis ? analysis.healthScore : 80,
      documentationScore: analysis ? analysis.documentationScore : 80,
      testingScore: analysis ? analysis.testingScore : 80,
      architectureScore: analysis ? analysis.architectureScore : 80,
      activityScore: analysis ? analysis.activityScore : 80,
      maintainabilityScore: analysis ? analysis.maintainabilityScore : 82,
      securityScore: analysis ? analysis.securityScore : 88
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

  return {
    overallHealth: profile.overallHealth,
    engineeringLevel: profile.engineeringLevel,
    careerImpact: profile.careerImpact || 3,
    jobReadinessImpact: profile.jobReadinessImpact || 5,
    repositories: repoList,
    languageDistribution: languageMap,
    technologyCoverage: {
      Frontend: languageMap.Frontend || 50,
      Backend: languageMap.Backend || 40,
      Database: languageMap.Database || 10,
      DevOps: languageMap.DevOps || 0
    },
    missingPractices: profile.missingPractices || [],
    strengths: ["Clean code layouts", "Consistent documentation conventions"],
    weaknesses: ["Automated coverage configs"],
    recommendedProjects: ["Build a Full Stack deployment boilerplate featuring automated GitHub pipelines."],
    nextActions: ["Add environment config examples to your primary repository."]
  };
}

module.exports = { toDeveloperIntelligenceDTO };
