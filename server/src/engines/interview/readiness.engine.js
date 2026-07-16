function calculateReadinessIncrease(overallScore) {
  // Estimate interview readiness gain up to +5 percentage points
  return Math.round((overallScore / 100) * 5);
}

module.exports = { calculateReadinessIncrease };
