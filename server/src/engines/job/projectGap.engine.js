function auditProjectGaps(jdSkills, techEvidence) {
  const flags = techEvidence || {
    hasAuth: false,
    hasDatabase: false,
    hasRestApi: false,
    hasDocker: false,
    hasTesting: false,
    hasDevOps: false
  };

  const missing = [];
  
  const hasDockerKeywords = (jdSkills || []).some(s => ["Docker", "Kubernetes", "DevOps"].includes(s));
  if (hasDockerKeywords && !flags.hasDocker) {
    missing.push("Docker Containerization");
  }

  const hasTestKeywords = (jdSkills || []).some(s => ["Jest", "Cypress", "Vitest", "Testing"].includes(s));
  if (hasTestKeywords && !flags.hasTesting) {
    missing.push("Unit Testing");
  }

  const hasAuthKeywords = (jdSkills || []).some(s => ["JWT", "Passport", "Auth"].includes(s));
  if (hasAuthKeywords && !flags.hasAuth) {
    missing.push("JWT Authentication");
  }

  const hasDbKeywords = (jdSkills || []).some(s => ["MongoDB", "PostgreSQL", "Database", "SQL"].includes(s));
  if (hasDbKeywords && !flags.hasDatabase) {
    missing.push("Database Integration");
  }

  const score = jdSkills && jdSkills.length > 0
    ? Math.round(((jdSkills.length - missing.length) / jdSkills.length) * 100)
    : 80;

  return {
    score: Math.min(100, Math.max(30, score)),
    missing
  };
}

module.exports = { auditProjectGaps };
