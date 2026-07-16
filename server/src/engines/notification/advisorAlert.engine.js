function evaluateAdvisorAlerts(userStats) {
  const alerts = [];

  if (userStats.streakDays < 3) {
    alerts.push({
      title: "Streak Multiplier Drop",
      message: "Your learning streak is low! Master a timeline concept today to secure your consistency multipliers.",
      type: "warning",
      source: "advisor"
    });
  }

  return alerts;
}

module.exports = { evaluateAdvisorAlerts };
