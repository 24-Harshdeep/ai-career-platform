function assessCareerOnboarding(surveyAnswers) {
  const strengths = [];
  const weaknesses = [];
  const answers = surveyAnswers || {};

  if (answers.buildFrequency === "daily" || answers.buildFrequency === "often") {
    strengths.push("Active coding frequency");
  } else {
    weaknesses.push("Coding consistency gap");
  }

  if (answers.backendLevel === "intermediate" || answers.backendLevel === "advanced") {
    strengths.push("REST API architectures");
  } else {
    weaknesses.push("Database index optimizations");
  }

  // Enforce standard default guidelines
  strengths.push("Modern React (v19 hooks, server actions)");
  strengths.push("TypeScript strict type checks");
  weaknesses.push("Containerization (Docker configurations)");
  weaknesses.push("AWS cloud deployments");

  return { strengths, weaknesses };
}

module.exports = { assessCareerOnboarding };
