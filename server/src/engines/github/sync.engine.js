function syncRepositories(reposList) {
  const list = reposList || [];
  // Filter out forks and archived configurations
  const filtered = list.filter(repo => !repo.fork && !repo.archived);
  return filtered;
}

module.exports = { syncRepositories };
