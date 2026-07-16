function analyzeCommitFrequency(commitsCount, lastCommitDate) {
  const lastDate = new Date(lastCommitDate || Date.now());
  const today = new Date();
  const diffTime = Math.abs(today - lastDate);
  const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30);

  let status = "Active";
  let activityScore = 85;

  if (diffMonths > 6) {
    status = "Dormant";
    activityScore = 45;
  } else if (diffMonths > 2) {
    status = "Inactive";
    activityScore = 65;
  } else {
    activityScore = Math.min(100, 70 + Math.min(30, commitsCount * 1.5));
  }

  return {
    activityScore: Math.round(activityScore),
    status,
    commitsCount: commitsCount || 20,
    lastCommitDate: lastCommitDate || today.toISOString()
  };
}

module.exports = { analyzeCommitFrequency };
