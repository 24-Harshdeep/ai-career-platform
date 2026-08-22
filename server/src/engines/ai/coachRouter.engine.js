const { COACH_PROMPTS } = require("../../config/ai/coachPrompts");

function routeCoachPrompt(activePath, userContext) {
  const path = (activePath || "").toLowerCase();
  
  let coachKey = "career";
  if (path.includes("/resume")) {
    coachKey = "resume";
  } else if (path.includes("/roadmap")) {
    coachKey = "roadmap";
  } else if (path.includes("/interview")) {
    coachKey = "interview";
  } else if (path.includes("/portfolio") || path.includes("/project")) {
    coachKey = "project";
  }

  const promptConfig = COACH_PROMPTS[coachKey];
  let systemPrompt = promptConfig.systemPrompt;

  // Context interpolations
  const role = userContext.goal || "Full Stack Developer";
  const score = userContext.score ?? null;
  const level = userContext.experienceLevel || "Intermediate";

  if (coachKey === "resume") {
    systemPrompt = systemPrompt
      .replace("{targetRole}", role)
      .replace("{atsScore}", userContext.resumeAtsScore ?? "not available")
      .replace("{missingKeywords}", (userContext.missingKeywords || []).join(", "))
      .replace("{suggestedImprovements}", (userContext.suggestedImprovements || []).join("; "));
  } else if (coachKey === "roadmap") {
    systemPrompt = systemPrompt
      .replace("{targetRole}", role)
      .replace("{activeTrack}", userContext.activeTrack || "Frontend Developer Core")
      .replace("{nextSubSkill}", userContext.nextSubSkill || "JWT Authentication");
  } else if (coachKey === "interview") {
    systemPrompt = systemPrompt
      .replace("{targetRole}", role)
      .replace("{engineeringLevel}", level)
      .replace("{interviewReadiness}", userContext.interviewReadiness || 50);
  } else if (coachKey === "project") {
    systemPrompt = systemPrompt
      .replace("{targetRole}", role)
      .replace("{repoCount}", userContext.repoCount || 3)
      .replace("{overallHealth}", userContext.overallHealth ?? "not available")
      .replace("{missingPractices}", (userContext.missingPractices || []).join(", "));
  } else {
    systemPrompt = systemPrompt
      .replace("{targetRole}", role)
      .replace("{careerScore}", score)
      .replace("{experienceLevel}", level);
  }

  return {
    role: promptConfig.role,
    systemPrompt
  };
}

module.exports = { routeCoachPrompt };
