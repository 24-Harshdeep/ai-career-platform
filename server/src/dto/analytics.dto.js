function toAnalyticsDashboardDTO(snapshot, consistency, skillTrend, achievements, prediction, weeklyReport, events) {
  return {
    careerScore: snapshot?.careerScore ?? null,
    resumeScore: snapshot?.resumeScore ?? null,
    developerScore: snapshot?.developerScore ?? null,
    projectScore: snapshot?.projectScore ?? null,
    roadmapScore: snapshot?.roadmapScore ?? null,
    interviewScore: snapshot?.interviewScore ?? null,
    weeklyGrowth: snapshot?.weeklyGrowth ?? null,
    monthlyGrowth: snapshot?.monthlyGrowth ?? null,
    
    // Streaks heatmap
    streakDays: consistency?.streakDays ?? null,
    heatMapDays: consistency?.heatMapDays ?? [],

    // Radar categories
    skillsDistribution: skillTrend ? skillTrend.distribution : [],
    strongestSkill: skillTrend?.strongest ?? null,
    weakestSkill: skillTrend?.weakest ?? null,

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
