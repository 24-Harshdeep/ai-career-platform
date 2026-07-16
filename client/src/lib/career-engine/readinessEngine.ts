export interface ReadinessInput {
  careerScore: number;
  hasResumeScanned: boolean;
  hasGithubScanned: boolean;
  projectsCount: number;
  masteredQuestionsCount: number;
}

export interface ReadinessScores {
  jobReadiness: number;
  resumeReadiness: number;
  portfolioReadiness: number;
  interviewReadiness: number;
  recommendation: string;
}

export function calculateReadiness(input: ReadinessInput): ReadinessScores {
  // 1. Resume Readiness (82% base, 86% scanned, up to 95% if career score is high)
  let resumeReadiness = 72;
  if (input.hasResumeScanned) {
    resumeReadiness = 86;
  } else {
    resumeReadiness = 82;
  }

  // 2. Portfolio Readiness
  // Connect github + projects count
  let portfolioReadiness = 50;
  if (input.hasGithubScanned) portfolioReadiness += 25;
  portfolioReadiness += Math.min(25, input.projectsCount * 8);

  // 3. Interview Readiness
  const interviewReadiness = Math.min(100, 30 + input.masteredQuestionsCount * 20);

  // 4. Job Readiness (Overall aggregate)
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
