function projectFutureScore(currentScore, weeklyVelocity) {
  const velocity = Math.max(1, weeklyVelocity || 2); 
  const days = 21; 
  const expectedIncrease = Math.round((days / 7) * velocity);
  const targetScore = Math.min(100, currentScore + expectedIncrease);

  return {
    targetScore,
    daysRemaining: days,
    requiredPractice: "Complete Docker configurations, audit database index parameters, and practice mock behavioral scenarios."
  };
}

module.exports = { projectFutureScore };
