function calculateGrowthDeltas(currentScore, historicSnapshots = []) {
  if (currentScore == null || historicSnapshots.length === 0) {
    return { weeklyGrowth: null, monthlyGrowth: null };
  }

  // Sort chronologically ascending
  const sorted = [...historicSnapshots].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const oldest = sorted[0].careerScore;

  const weeklyGrowth = currentScore - oldest;
  const monthlyGrowth = currentScore - oldest; // Fallback to oldest snapshot diff if history is short

  return {
    weeklyGrowth: Math.max(0, weeklyGrowth),
    monthlyGrowth: Math.max(0, monthlyGrowth)
  };
}

module.exports = { calculateGrowthDeltas };
