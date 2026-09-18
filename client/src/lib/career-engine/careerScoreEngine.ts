import { UserProfile, RoadmapModule, Mission, JobApplication } from "@/types";

export interface ScoreInput {
  hasResumeScanned: boolean;
  hasGithubScanned: boolean;
  projectsCount: number;
  skillsCount: number;
  roadmapAverageProgress: number;
  applicationsCount: number;
  masteredQuestionsCount: number;
  streakDays: number;
}

export interface ScoreExplanation {
  label: string;
  score: number;
  maxScore: number;
  status: "Assessed" | "Not Assessed Yet" | "In Progress";
  explanation: string;
  actionRequired?: string;
}

export function calculateCareerScore(input: ScoreInput): {
  score: number;
  breakdown: Record<string, number>;
  explanations: Record<string, ScoreExplanation>;
} {
  // Weights configuration (Total = 100)
  const weights = {
    resume: 15,
    github: 15,
    projects: 20,
    skills: 15,
    learning: 10,
    applications: 10,
    interview: 10,
    consistency: 5,
  };

  // 1. Resume Score (max 15) - 0 if not scanned, 15 if scanned
  const resumePoints = input.hasResumeScanned ? weights.resume : 0;

  // 2. GitHub Score (max 15) - 0 if not scanned, 15 if scanned & synced
  const githubPoints = input.hasGithubScanned ? weights.github : 0;

  // 3. Projects Score (max 20)
  // 3+ projects = 20 points, 2 = 14 points, 1 = 8 points, 0 = 0 points
  let projectsPoints = 0;
  if (input.projectsCount >= 3) projectsPoints = weights.projects;
  else if (input.projectsCount === 2) projectsPoints = 14;
  else if (input.projectsCount === 1) projectsPoints = 8;

  // 4. Skills Profile Score (max 15)
  // Scaled up to 7 target skills
  const skillsPoints = Math.min(weights.skills, (input.skillsCount / 7) * weights.skills);

  // 5. Learning / Roadmap (max 10)
  const learningPoints = ((input.roadmapAverageProgress || 0) / 100) * weights.learning;

  // 6. Job Applications (max 10)
  // 3 applications tracked = max points
  const applicationsPoints = Math.min(
    weights.applications,
    (input.applicationsCount / 3) * weights.applications
  );

  // 7. Interview Prep (max 10)
  // 3 questions mastered = max points
  const interviewPoints = Math.min(
    weights.interview,
    (input.masteredQuestionsCount / 3) * weights.interview
  );

  // 8. Consistency / Streak (max 5)
  // 7 days = max points
  const consistencyPoints = Math.min(
    weights.consistency,
    (input.streakDays / 7) * weights.consistency
  );

  const rawScore =
    resumePoints +
    githubPoints +
    projectsPoints +
    skillsPoints +
    learningPoints +
    applicationsPoints +
    interviewPoints +
    consistencyPoints;

  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  const explanations: Record<string, ScoreExplanation> = {
    resume: {
      label: "Resume ATS Alignment",
      score: Math.round(resumePoints),
      maxScore: weights.resume,
      status: input.hasResumeScanned ? "Assessed" : "Not Assessed Yet",
      explanation: input.hasResumeScanned
        ? "Resume uploaded and parsed for ATS target role keywords."
        : "No resume has been uploaded or scanned yet.",
      actionRequired: input.hasResumeScanned ? undefined : "Upload resume in Resume Intelligence module.",
    },
    github: {
      label: "GitHub Code Evidence",
      score: Math.round(githubPoints),
      maxScore: weights.github,
      status: input.hasGithubScanned ? "Assessed" : "Not Assessed Yet",
      explanation: input.hasGithubScanned
        ? "GitHub account connected and repositories analyzed for code quality."
        : "GitHub profile is not connected or repository metrics are unavailable.",
      actionRequired: input.hasGithubScanned ? undefined : "Connect your GitHub username in Portfolio Intelligence.",
    },
    projects: {
      label: "Project Portfolio Evidence",
      score: Math.round(projectsPoints),
      maxScore: weights.projects,
      status: input.projectsCount > 0 ? "Assessed" : "Not Assessed Yet",
      explanation: `${input.projectsCount} portfolio project(s) audited for architecture and deployment.`,
      actionRequired: input.projectsCount >= 3 ? undefined : "Add or audit at least 3 active projects.",
    },
    skills: {
      label: "Target Skill Matrix",
      score: Math.round(skillsPoints),
      maxScore: weights.skills,
      status: input.skillsCount > 0 ? "Assessed" : "Not Assessed Yet",
      explanation: `${input.skillsCount} verified technical skills matching target role requirements.`,
      actionRequired: input.skillsCount >= 7 ? undefined : "Select target skills in Career DNA profile.",
    },
    learning: {
      label: "Roadmap Progression",
      score: Math.round(learningPoints),
      maxScore: weights.learning,
      status: input.roadmapAverageProgress > 0 ? "In Progress" : "Not Assessed Yet",
      explanation: `Completed ${Math.round(input.roadmapAverageProgress)}% of personalized roadmap objectives.`,
      actionRequired: input.roadmapAverageProgress >= 100 ? undefined : "Complete roadmap sub-skills to build technical mastery.",
    },
    applications: {
      label: "Job Application Pipeline",
      score: Math.round(applicationsPoints),
      maxScore: weights.applications,
      status: input.applicationsCount > 0 ? "Assessed" : "Not Assessed Yet",
      explanation: `${input.applicationsCount} application(s) active in career pipeline.`,
      actionRequired: input.applicationsCount >= 3 ? undefined : "Track target jobs in Applications module.",
    },
    interview: {
      label: "Interview Mastery",
      score: Math.round(interviewPoints),
      maxScore: weights.interview,
      status: input.masteredQuestionsCount > 0 ? "Assessed" : "Not Assessed Yet",
      explanation: `${input.masteredQuestionsCount} mock interview questions answered and mastered.`,
      actionRequired: input.masteredQuestionsCount >= 3 ? undefined : "Practice mock interviews in Interview Intelligence.",
    },
    consistency: {
      label: "Activity Streak",
      score: Math.round(consistencyPoints),
      maxScore: weights.consistency,
      status: input.streakDays > 0 ? "In Progress" : "Not Assessed Yet",
      explanation: `${input.streakDays} consecutive day(s) of active career progress.`,
      actionRequired: input.streakDays >= 7 ? undefined : "Log in daily to maintain learning streak.",
    },
  };

  return {
    score: finalScore,
    breakdown: {
      resume: Math.round(resumePoints),
      github: Math.round(githubPoints),
      projects: Math.round(projectsPoints),
      skills: Math.round(skillsPoints),
      learning: Math.round(learningPoints),
      applications: Math.round(applicationsPoints),
      interview: Math.round(interviewPoints),
      consistency: Math.round(consistencyPoints),
    },
    explanations,
  };
}

