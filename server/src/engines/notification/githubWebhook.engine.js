const crypto = require("crypto");

function parseGithubPushPayload(payload) {
  const repoName = payload.repository ? payload.repository.name : "repository";
  const commits = payload.commits || [];
  const headCommit = commits[0] || { message: "Updated codebase structure" };

  const title = `GitHub Commit Synced: ${repoName}`;
  const message = `Pushed commit: "${headCommit.message}". Technical evidence logs updated.`;

  return {
    title,
    message,
    pointsGained: Math.min(5, commits.length * 2 || 2),
    metadata: {
      repository: repoName,
      commitMessage: headCommit.message,
      commitsCount: commits.length
    }
  };
}

module.exports = { parseGithubPushPayload };
