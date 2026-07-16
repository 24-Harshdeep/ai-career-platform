function auditMilestonesUnlocks(userStats) {
  const achievements = [];

  if (userStats.hasResumeScanned) {
    achievements.push({
      title: "First Resume Uploaded",
      description: "Successfully processed resume parameters through ATS keyword matching.",
      badgeUrl: "/badges/resume.png"
    });
  }

  if (userStats.projectsCount >= 3) {
    achievements.push({
      title: "Active Portfolio Scanned",
      description: "Analyzed three or more codebases demonstrating technology evidence.",
      badgeUrl: "/badges/portfolio.png"
    });
  }

  return achievements;
}

module.exports = { auditMilestonesUnlocks };
