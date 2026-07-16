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

export function calculateCareerScore(input: ScoreInput): {
  score: number;
  breakdown: Record<string, number>;
} {
  // Weights configuration
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

  // 1. Resume Score (max 15)
  const resumePoints = input.hasResumeScanned ? weights.resume : 10; // 10 base, 15 scanned

  // 2. GitHub Score (max 15)
  const githubPoints = input.hasGithubScanned ? weights.github : 8; // 8 base, 15 scanned

  // 3. Projects Score (max 20)
  // 3 projects = 20 points, 2 = 14 points, 1 = 8 points, 0 = 0 points
  let projectsPoints = 0;
  if (input.projectsCount >= 3) projectsPoints = weights.projects;
  else if (input.projectsCount === 2) projectsPoints = 14;
  else if (input.projectsCount === 1) projectsPoints = 8;

  // 4. Skills Profile Score (max 15)
  // Max score achieved at 7 target skills
  const skillsPoints = Math.min(weights.skills, (input.skillsCount / 7) * weights.skills);

  // 5. Learning / Roadmap (max 10)
  const learningPoints = (input.roadmapAverageProgress / 100) * weights.learning;

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
  };
}
