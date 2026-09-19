function calculateReadiness(input) {
  const resumeReadiness = input.hasResumeScanned ? input.resumeScore : null;

  const portfolioReadiness = input.hasGithubScanned ? Math.min(100, input.projectsCount * 8 + 25) : null;

  const interviewReadiness = (input.interviewScore !== undefined && input.interviewScore !== null && input.interviewScore > 0)
    ? input.interviewScore
    : (input.masteredQuestionsCount > 0 ? Math.min(100, input.masteredQuestionsCount * 20) : null);

  const jobReadiness = Math.round(
    input.careerScore * 0.65 +
    (resumeReadiness || 0) * 0.15 +
    (portfolioReadiness || 0) * 0.1 +
    (interviewReadiness || 0) * 0.1
  );

  let recommendation = "Build Foundation";
  if (jobReadiness >= 85) {
    recommendation = "Apply Instantly";
  } else if (jobReadiness >= 75) {
    recommendation = "Polish Artifacts";
  } else {
    recommendation = "Study Foundations";
  }

  return {
    jobReadiness: Math.min(100, jobReadiness),
    resumeReadiness,
    portfolioReadiness,
    interviewReadiness,
    recommendation
  };
}

module.exports = { calculateReadiness };
