function projectReadinessTimeline(missingSkillsCount) {
  // Estimate 3 days study/deployment duration per missing technology gap
  return missingSkillsCount * 3;
}

module.exports = { projectReadinessTimeline };
