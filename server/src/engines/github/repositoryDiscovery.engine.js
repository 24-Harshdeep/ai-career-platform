function discoverRepositoryMetadata(repo) {
  if (!repo) return null;
  return {
    name: repo.name,
    description: repo.description || "",
    url: repo.html_url || repo.url || "",
    defaultBranch: repo.default_branch || "main",
    visibility: repo.private ? "private" : "public",
    primaryLanguage: repo.language || "JavaScript",
    stars: repo.stargazers_count || repo.stars || 0,
    forks: repo.forks_count || repo.forks || 0,
    watchers: repo.watchers_count || repo.watchers || 0,
    topics: repo.topics || []
  };
}

module.exports = { discoverRepositoryMetadata };
