const { LANGUAGE_MAPPINGS } = require("../../config/github/languageMappings");

function analyzeLanguageDistribution(reposList) {
  const list = reposList || [];
  const totals = {
    Frontend: 0,
    Backend: 0,
    DevOps: 0,
    Database: 0
  };

  let totalCount = 0;

  for (const repo of list) {
    const lang = repo.primaryLanguage;
    const category = LANGUAGE_MAPPINGS[lang] || "Backend";
    totals[category] += 1;
    totalCount += 1;
  }

  const distribution = {};
  for (const cat in totals) {
    distribution[cat] = totalCount > 0 
      ? Math.round((totals[cat] / totalCount) * 100) 
      : 0;
  }

  // Ensure default fallback if list is empty
  if (totalCount === 0) {
    distribution.Frontend = 50;
    distribution.Backend = 40;
    distribution.Database = 10;
    distribution.DevOps = 0;
  }

  return distribution;
}

module.exports = { analyzeLanguageDistribution };
