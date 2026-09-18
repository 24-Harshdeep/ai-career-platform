const { SKILL_CATEGORIES } = require("../../config/skills");

/**
 * Match candidate skills against target role taxonomy or explicit JD required skills.
 * Distinguishes "supported_but_missing" (evidence in experience/projects) vs "potential_skill_gap" (no evidence).
 */
function matchRoleKeywords(parsedSkills = [], targetRole = "Full Stack Developer", rawText = "") {
  let requiredList = [];

  const role = (targetRole || "Full Stack Developer").trim();

  if (role === "Frontend Lead" || role.toLowerCase().includes("frontend")) {
    requiredList = [
      "React",
      "TypeScript",
      "JavaScript",
      "Next.js",
      "HTML5",
      "CSS3",
      "Tailwind",
      "State Management",
      "REST APIs",
      "Web Performance"
    ];
  } else if (role === "Backend Architect" || role.toLowerCase().includes("backend")) {
    requiredList = [
      "Node.js",
      "Express",
      "TypeScript",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "Docker",
      "REST APIs",
      "Microservices",
      "System Design"
    ];
  } else if (role.toLowerCase().includes("devops") || role.toLowerCase().includes("cloud")) {
    requiredList = [
      "Docker",
      "Kubernetes",
      "AWS",
      "CI/CD",
      "Terraform",
      "Linux",
      "Nginx",
      "Python",
      "Git",
      "Monitoring"
    ];
  } else {
    // Default: Full Stack Developer
    requiredList = [
      "React",
      "Next.js",
      "TypeScript",
      "Node.js",
      "Express",
      "MongoDB",
      "PostgreSQL",
      "Docker",
      "REST APIs",
      "Git"
    ];
  }

  const parsedFlat = (parsedSkills || []).map(s => String(s).toLowerCase().trim());
  const textLower = (rawText || "").toLowerCase();

  const matchedKeywords = [];
  const missingKeywords = [];

  for (const reqSkill of requiredList) {
    const sLower = reqSkill.toLowerCase();
    const isMatchedInSkills = parsedFlat.some(p => p.includes(sLower) || sLower.includes(p));

    if (isMatchedInSkills) {
      matchedKeywords.push(reqSkill);
    } else {
      // Check if evidence exists in raw text / bullet points
      const hasEvidenceInText = textLower.includes(sLower);
      const category = hasEvidenceInText ? "supported_but_missing" : "potential_skill_gap";

      let importance = "Medium";
      let expectedScoreGain = 3;
      let expectedReadinessGain = 4;
      let reason = hasEvidenceInText
        ? `Evidence of ${reqSkill} concept was detected in project/experience descriptions, but the explicit keyword tag is missing.`
        : `Target ${role} role expects ${reqSkill}, but no evidence was found in your resume.`;

      if (["React", "Next.js", "TypeScript", "Node.js", "Docker", "REST APIs"].includes(reqSkill)) {
        importance = "High";
        expectedScoreGain = 5;
        expectedReadinessGain = 6;
      }

      missingKeywords.push({
        keyword: reqSkill,
        importance,
        category, // 'supported_but_missing' | 'potential_skill_gap'
        reason,
        expectedScoreGain,
        expectedReadinessGain,
        eligibleForAutoInsert: hasEvidenceInText
      });
    }
  }

  return {
    matchedCount: matchedKeywords.length,
    totalRequired: requiredList.length,
    matchedKeywords,
    missingKeywords
  };
}

module.exports = { matchRoleKeywords };
