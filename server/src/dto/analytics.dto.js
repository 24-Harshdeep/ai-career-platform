function toAnalyticsDashboardDTO(snapshot, consistency, skillTrend, achievements, prediction, weeklyReport, events) {
  return {
    careerScore: snapshot ? snapshot.careerScore : 82,
    resumeScore: snapshot ? snapshot.resumeScore : 80,
    developerScore: snapshot ? snapshot.developerScore : 80,
    projectScore: snapshot ? snapshot.projectScore : 80,
    roadmapScore: snapshot ? snapshot.roadmapScore : 50,
    interviewScore: snapshot ? snapshot.interviewScore : 50,
    weeklyGrowth: snapshot ? snapshot.weeklyGrowth : 2,
    monthlyGrowth: snapshot ? snapshot.monthlyGrowth : 5,
    
    // Streaks heatmap
    streakDays: consistency ? consistency.streakDays : 3,
    heatMapDays: consistency ? consistency.heatMapDays : [1, 0, 2, 0, 1, 1, 0],

    // Radar categories
    skillsDistribution: skillTrend ? skillTrend.distribution : [],
    strongestSkill: skillTrend ? skillTrend.strongest : "Frontend",
    weakestSkill: skillTrend ? skillTrend.weakest : "DevOps",

    // Achievements unlocked
    achievements: (achievements || []).map(a => ({
      id: a._id || a.id,
      title: a.title,
      description: a.description,
      badgeUrl: a.badgeUrl,
      unlockedAt: a.createdAt || a.unlockedAt
    })),

    // Predicted forecasts
    prediction: prediction ? {
      targetScore: prediction.targetScore,
      daysRemaining: prediction.daysRemaining,
      requiredPractice: prediction.requiredPractice
    } : null,

    // Weekly digest
    weeklyReport: weeklyReport ? {
      summary: weeklyReport.summary,
      completedTasksCount: weeklyReport.completedTasksCount,
      pointsEarned: weeklyReport.pointsEarned,
      nextWeekFocus: weeklyReport.nextWeekFocus
    } : null,

    // Activity timeline events
    activityTimeline: (events || []).map(e => ({
      id: e._id || e.id,
      eventType: e.eventType,
      source: e.source,
      pointsEarned: e.pointsEarned,
      metadata: e.metadata || {},
      createdAt: e.createdAt
    }))
  };
}

module.exports = { toAnalyticsDashboardDTO };
