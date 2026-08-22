function compileSkillTrend(profileSkills) {
  const entries = Object.entries(profileSkills || {}).filter(([, values]) => Array.isArray(values) && values.length > 0);
  if (entries.length === 0) return { distribution: [], strongest: null, weakest: null };
  const distribution = entries.map(([category, values]) => ({
    category,
    rating: Math.min(100, values.length * 10)
  }));
  const sorted = [...distribution].sort((a, b) => b.rating - a.rating);

  return {
    distribution,
    strongest: sorted[0]?.category || null,
    weakest: sorted[sorted.length - 1]?.category || null
  };
}

module.exports = { compileSkillTrend };
