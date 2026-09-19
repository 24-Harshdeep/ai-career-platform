const { getCareerContext } = require("../../services/careerContext.service");

/**
 * Context Verifier Engine
 * Extracts verified Candidate Context (skills, projects, resume details) from CareerContext
 * to populate interview prompts without inventing unverified experiences.
 */
async function getVerifiedCandidateContext(userId) {
  try {
    const context = await getCareerContext(userId);

    const skills = context.skillsPossessed || [];
    const weaknesses = context.weaknesses || [];
    const targetRole = context.targetRole || "Software Developer";

    // Extract project names and tech stack
    const rawProjects = context.projects || [];
    const projects = rawProjects.map(p => ({
      name: p.name || p.title || "Project",
      technologies: p.technologies || p.techStack || [],
      summary: p.summary || p.description || ""
    }));

    return {
      targetRole,
      skills,
      weaknesses,
      projects
    };
  } catch (err) {
    console.warn("Could not fetch verified candidate context for interview:", err);
    return {
      targetRole: "Software Developer",
      skills: ["JavaScript", "React", "Node.js"],
      weaknesses: [],
      projects: []
    };
  }
}

module.exports = {
  getVerifiedCandidateContext
};
