export interface ReadinessInput {
  careerScore: number;
  hasResumeScanned: boolean;
  hasGithubScanned: boolean;
  projectsCount: number;
  masteredQuestionsCount: number;
}

export interface ReadinessScores {
  jobReadiness: number;
  resumeReadiness: number | null;
  portfolioReadiness: number | null;
  interviewReadiness: number | null;
  recommendation: string;
}

export function calculateReadiness(input: ReadinessInput): ReadinessScores {
  // 1. Resume Readiness (null/0 if not scanned)
  const resumeReadiness = input.hasResumeScanned ? 86 : null;

  // 2. Portfolio Readiness (null/0 if github not scanned & 0 projects)
  let portfolioReadiness: number | null = null;
  if (input.hasGithubScanned || input.projectsCount > 0) {
    let score = 0;
    if (input.hasGithubScanned) score += 50;
    score += Math.min(50, input.projectsCount * 18);
    portfolioReadiness = Math.min(100, score);
  }

  // 3. Interview Readiness (null/0 if 0 questions mastered)
  const interviewReadiness: number | null = input.masteredQuestionsCount > 0
    ? Math.min(100, input.masteredQuestionsCount * 25)
    : null;

  // 4. Job Readiness (Overall weighted aggregate from active evidence)
  const activeResume = resumeReadiness ?? 0;
  const activePortfolio = portfolioReadiness ?? 0;
  const activeInterview = interviewReadiness ?? 0;

  const jobReadiness = Math.round(
    input.careerScore * 0.55 +
    activeResume * 0.15 +
    activePortfolio * 0.15 +
    activeInterview * 0.15
  );

  let recommendation = "Connect Evidence";
  if (jobReadiness >= 85) {
    recommendation = "Ready for Target Applications";
  } else if (jobReadiness >= 65) {
    recommendation = "Optimize Resume & Interview Prep";
  } else if (jobReadiness >= 40) {
    recommendation = "Build Portfolio & Complete Roadmap";
  } else {
    recommendation = "Complete Onboarding & Scan Resume";
  }

  return {
    jobReadiness: Math.min(100, Math.max(0, jobReadiness)),
    resumeReadiness,
    portfolioReadiness,
    interviewReadiness,
    recommendation,
  };
}

