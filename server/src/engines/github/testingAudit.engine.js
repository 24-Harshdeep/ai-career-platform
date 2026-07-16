const { REPOSITORY_RULES } = require("../../config/github/repositoryRules");

function auditTesting(filesList, packageJsonContent) {
  const filesFlat = (filesList || []).map(f => f.toLowerCase());
  const pkgText = (packageJsonContent || "").toLowerCase();
  const keywords = REPOSITORY_RULES.testingKeywords;

  const matchedKeywords = keywords.filter(kw => {
    const fileMatch = filesFlat.some(f => f.includes(kw));
    const pkgMatch = pkgText.includes(kw);
    return fileMatch || pkgMatch;
  });

  const hasTestWorkflows = filesFlat.some(f => f.includes("github/workflows") && f.includes("test"));
  
  let score = 40;
  const missingPractices = [];

  if (matchedKeywords.length > 0) {
    score += Math.min(45, matchedKeywords.length * 15);
  } else {
    missingPractices.push("Missing automated unit tests (Jest / Vitest)");
  }

  if (hasTestWorkflows) {
    score += 15;
  } else {
    missingPractices.push("Missing CI automation triggers");
  }

  return {
    score: Math.min(100, score),
    missingPractices
  };
}

module.exports = { auditTesting };
