function computeNextBestAction(input) {
  if (!input.hasResumeScanned) {
    return {
      title: "Analyze & Optimize Resume ATS",
      impact: 2,
      duration: "10 mins",
      reason: "Missing key ATS qualifiers. Optimizing matches your target goal in 100% of screenings.",
      priority: "High",
    };
  }

  if (!input.hasGithubScanned) {
    return {
      title: "Connect & Scan GitHub Portfolio",
      impact: 3,
      duration: "15 mins",
      reason: "Index code metrics, project document completeness scores, and commit frequencies.",
      priority: "High",
    };
  }

  if (!input.hasCompletedM1) {
    return {
      title: "Build API Authentication (JWT Module)",
      impact: 3,
      duration: "2 hours",
      reason: "Authentication architecture is present in 78% of target developer job descriptions.",
      priority: "High",
    };
  }

  if (!input.hasCompletedM2) {
    return {
      title: "Optimize PostgreSQL Database Index Queries",
      impact: 2,
      duration: "1 hour",
      reason: "Database optimization is a core Backend skill gap identified in your Career DNA profile.",
      priority: "Medium",
    };
  }

  return {
    title: "Conduct AI Mock Interview Practice",
    impact: 2,
    duration: "45 mins",
    reason: "Prepare behavioral and technical responses. Ready for target job applications.",
    priority: "Medium",
  };
}

module.exports = { computeNextBestAction };
