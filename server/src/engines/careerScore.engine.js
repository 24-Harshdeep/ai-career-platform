const { CAREER_SCORE_WEIGHTS } = require("../config/weights");

function calculateCareerScore(input) {
  const weights = CAREER_SCORE_WEIGHTS;

  const resumePoints = input.hasResumeScanned ? weights.resume : 0;
  const githubPoints = input.hasGithubScanned ? weights.github : 0;

  let projectsPoints = 0;
  if (input.projectsCount >= 3) projectsPoints = weights.projects;
  else if (input.projectsCount === 2) projectsPoints = 14;
  else if (input.projectsCount === 1) projectsPoints = 8;

  // Max score achieved at 7 possessed skills
  const skillsPoints = Math.min(weights.skills, (input.skillsCount / 7) * weights.skills);
  const learningPoints = (input.roadmapAverageProgress / 100) * weights.learning;
  
  const applicationsPoints = Math.min(
    weights.applications,
    (input.applicationsCount / 3) * weights.applications
  );
  
  const interviewPoints = Math.min(
    weights.interview,
    (input.masteredQuestionsCount / 3) * weights.interview
  );
  
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
      consistency: Math.round(consistencyPoints)
    }
  };
}

module.exports = { calculateCareerScore };
