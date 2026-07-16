function calculateMissionReward(mission, currentXp, currentLevel) {
  const xpReward = mission.xpReward || 50;
  const scoreReward = mission.scoreReward || 1;

  const newXp = currentXp + xpReward;
  // Level up threshold set at every 1000 XP
  const newLevel = Math.floor(newXp / 1000) + 1;
  const leveledUp = newLevel > currentLevel;

  return {
    xpGained: xpReward,
    scoreGained: scoreReward,
    newXp,
    newLevel,
    leveledUp
  };
}

module.exports = { calculateMissionReward };
