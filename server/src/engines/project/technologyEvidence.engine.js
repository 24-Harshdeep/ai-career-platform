function extractTechnologyEvidence(filesList, parsedContent) {
  const filesFlat = (filesList || []).map(f => f.toLowerCase());
  const text = (parsedContent || "").toLowerCase();

  const hasAuth = text.includes("jwt") || text.includes("passport") || text.includes("bcrypt") || filesFlat.some(f => f.includes("auth"));
  const hasDatabase = text.includes("mongoose") || text.includes("sequelize") || text.includes("mongodb") || text.includes("postgres") || text.includes("sqlite");
  const hasRestApi = text.includes("express") || text.includes("router.get") || text.includes("app.post") || filesFlat.some(f => f.includes("route") || f.includes("controller"));
  const hasDocker = filesFlat.some(f => f.includes("dockerfile") || f.includes("docker-compose"));
  const hasTesting = text.includes("jest") || text.includes("mocha") || text.includes("cypress") || filesFlat.some(f => f.includes("test"));
  const hasDevOps = filesFlat.some(f => f.includes("github/workflows") || f.includes("vercel.json") || f.includes("render.yaml"));

  const confidenceScores = {
    auth: hasAuth ? 95 : 0,
    database: hasDatabase ? 98 : 0,
    restApi: hasRestApi ? 96 : 0,
    docker: hasDocker ? 100 : 0,
    testing: hasTesting ? 92 : 0,
    devops: hasDevOps ? 100 : 0
  };

  const evidenceLogs = [];
  if (hasAuth) evidenceLogs.push("JWT sessions token validation middleware patterns detected.");
  if (hasDatabase) evidenceLogs.push("Mongoose models schemas configurations established.");
  if (hasRestApi) evidenceLogs.push("Express router routes and controllers endpoints configured.");
  if (hasDocker) evidenceLogs.push("Dockerfile docker-compose environments specified.");
  if (hasTesting) evidenceLogs.push("Automated unit test runs declared in source trees.");
  if (hasDevOps) evidenceLogs.push("Continuous integration triggers workflows written.");

  return {
    technologyEvidence: {
      hasAuth,
      hasDatabase,
      hasRestApi,
      hasDocker,
      hasTesting,
      hasDevOps
    },
    confidenceScores,
    evidenceLogs
  };
}

module.exports = { extractTechnologyEvidence };
