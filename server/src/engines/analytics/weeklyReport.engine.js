function compileWeeklyReportDigest(completedCount, pointsEarned) {
  return {
    summary: `You made solid progress this week by completing ${completedCount} checklist milestones and gaining +${pointsEarned} Career Score points.`,
    completedTasksCount: completedCount,
    pointsEarned,
    nextWeekFocus: ["Implement Jest testing parameters", "Refactor Express endpoints in repositories"]
  };
}

module.exports = { compileWeeklyReportDigest };
