function calculateReadiness(input) {
  let resumeReadiness = input.hasResumeScanned ? 86 : 82;

  let portfolioReadiness = 50;
  if (input.hasGithubScanned) portfolioReadiness += 25;
  portfolioReadiness += Math.min(25, input.projectsCount * 8);

  const interviewReadiness = Math.min(100, 30 + input.masteredQuestionsCount * 20);

  const jobReadiness = Math.round(
    input.careerScore * 0.7 +
    resumeReadiness * 0.1 +
    portfolioReadiness * 0.1 +
    interviewReadiness * 0.1
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
    resumeReadiness: Math.min(100, resumeReadiness),
    portfolioReadiness: Math.min(100, portfolioReadiness),
    interviewReadiness: Math.min(100, interviewReadiness),
    recommendation,
  };
}

module.exports = { calculateReadiness };
