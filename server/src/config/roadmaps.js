const frontend = require("./roadmaps/v1/frontend");
const backend = require("./roadmaps/v1/backend");
const systemDesign = require("./roadmaps/v1/systemDesign");

const ROADMAP_TEMPLATES = {
  v1: {
    frontend,
    backend,
    systemDesign
  }
};

// Returns templates based on targetRole goals
function getTemplatesForGoal(targetRole) {
  const v1Templates = ROADMAP_TEMPLATES.v1;
  const role = targetRole || "Full Stack Developer";

  if (role === "Frontend Lead") {
    return [v1Templates.frontend, v1Templates.systemDesign];
  }
  if (role === "Backend Architect" || role === "DevOps Specialist") {
    return [v1Templates.backend, v1Templates.systemDesign];
  }
  
  // Default to Full Stack (loads all three)
  return [v1Templates.frontend, v1Templates.backend, v1Templates.systemDesign];
}

module.exports = {
  ROADMAP_TEMPLATES,
  getTemplatesForGoal
};
