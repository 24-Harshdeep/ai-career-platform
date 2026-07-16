const { REPOSITORY_RULES } = require("../../config/github/repositoryRules");

function auditProjectStructure(filesList) {
  const filesFlat = (filesList || []).map(f => f.toLowerCase());
  const rules = REPOSITORY_RULES;

  const matched = rules.projectFiles.filter(pf => {
    return filesFlat.some(f => f.includes(pf));
  });

  const hasDocker = filesFlat.some(f => f.includes("dockerfile") || f.includes("docker-compose"));
  const hasWorkflow = filesFlat.some(f => f.includes("github/workflows"));

  let score = Math.round((matched.length / rules.projectFiles.length) * 70) + 30;

  const missingPractices = [];
  if (!filesFlat.some(f => f.includes(".gitignore"))) {
    missingPractices.push("Missing .gitignore file");
  }
  if (!filesFlat.some(f => f.includes(".env.example"))) {
    missingPractices.push("Missing .env.example credentials template");
  }
  if (!hasDocker) {
    missingPractices.push("Missing Docker container configurations");
  }
  if (!hasWorkflow) {
    missingPractices.push("Missing CI/CD pipeline setups");
  }

  return {
    score: Math.min(100, score),
    hasDocker,
    hasWorkflow,
    missingPractices
  };
}

module.exports = { auditProjectStructure };
