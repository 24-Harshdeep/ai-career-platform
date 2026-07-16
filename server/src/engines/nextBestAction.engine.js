const { ACTION_CATALOG } = require("../config/actions");

function computeNextBestAction(userState) {
  // Map completed action configurations based on user DB parameters
  const completedIds = [];
  if (userState.hasResumeScanned) completedIds.push("action-resume-upload");
  if (userState.hasResumeScanned && (userState.careerScore || 82) > 80) {
    completedIds.push("action-resume-keywords");
  }
  if (userState.hasGithubScanned) completedIds.push("action-github-connect");
  if (userState.completedM1) completedIds.push("action-roadmap-jwt");
  if (userState.completedM2) completedIds.push("action-roadmap-indexing");
  if (userState.masteredQuestionsCount >= 3) completedIds.push("action-interview-mock");
  if (userState.hasGithubScanned && userState.projectsCount >= 3) {
    completedIds.push("action-portfolio-audit");
  }

  // 1. Filter out already completed actions
  const incompleteActions = ACTION_CATALOG.filter(action => !completedIds.includes(action.id));

  // 2. Filter actions whose prerequisites are NOT satisfied
  const validActions = incompleteActions.filter(action => {
    if (!action.prerequisites || action.prerequisites.length === 0) return true;
    return action.prerequisites.every(prereqId => completedIds.includes(prereqId));
  });

  // 3. Score and project output variables
  const ranked = validActions.map(action => {
    const priority = action.priority || "Medium";
    let priorityWeight = 2;
    if (priority === "High") priorityWeight = 3;
    if (priority === "Low") priorityWeight = 1;

    // Rank metric formula
    const rankScore = action.expectedImpact * priorityWeight;

    // Project scores after completion
    const careerScoreAfterCompletion = Math.min(100, (userState.careerScore || 82) + action.scoreReward);
    const readinessDelta = Math.round(action.expectedImpact * 1.5);
    const jobReadinessAfterCompletion = Math.min(100, (userState.jobReadiness || 78) + readinessDelta);

    return {
      actionId: action.id,
      title: action.title,
      description: action.description,
      type: action.type,
      priority,
      impactScore: action.expectedImpact,
      estimatedTime: action.estimatedTime,
      confidence: action.confidence || 85,
      reason: action.reason,
      dependencies: action.prerequisites,
      careerScoreAfterCompletion,
      jobReadinessAfterCompletion,
      rankScore
    };
  });

  // Sort by rank score descending, then by impact descending
  ranked.sort((a, b) => {
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    return b.impactScore - a.impactScore;
  });

  return ranked;
}

module.exports = { computeNextBestAction };
