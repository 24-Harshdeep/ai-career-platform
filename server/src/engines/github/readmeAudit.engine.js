const { REPOSITORY_RULES } = require("../../config/github/repositoryRules");

function auditReadme(readmeContent) {
  const text = (readmeContent || "").toLowerCase();
  const keywords = REPOSITORY_RULES.readmeKeywords;

  const matched = keywords.filter(kw => text.includes(kw));
  // Baseline score at 30 if file is empty
  const score = Math.round((matched.length / keywords.length) * 70) + 30;
  const missing = keywords.filter(kw => !text.includes(kw));

  return {
    score: Math.max(30, Math.min(100, score)),
    missingPractices: missing.map(kw => `Missing README section: ${kw}`),
    matched
  };
}

module.exports = { auditReadme };
