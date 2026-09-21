/**
 * Evaluates candidate career context against a normalized Job.
 * Computes deterministic CareerOS Match score, skill gaps, and match explanations.
 *
 * @param {Object} candidateContext - User career context from getCareerContext()
 * @param {Object} job - Normalized Job object
 * @returns {Object} Structured match results
 */
function evaluateJobMatch(candidateContext = {}, job = {}) {
  const targetRole = candidateContext.targetRole || "Full Stack Developer";
  const userExperience = candidateContext.experienceLevel || "Intermediate";
  
  // Extract all candidate skills (possessed + resume identified skills)
  const possessedSkillsObj = candidateContext.skillsPossessed || {};
  const userSkillsSet = new Set();

  Object.values(possessedSkillsObj).forEach((skillArr) => {
    if (Array.isArray(skillArr)) {
      skillArr.forEach((s) => userSkillsSet.add(s.toLowerCase().trim()));
    }
  });

  if (candidateContext.resumeContext?.identifiedSkills) {
    candidateContext.resumeContext.identifiedSkills.forEach((s) => userSkillsSet.add(s.toLowerCase().trim()));
  }

  // Job skills
  const jobSkills = (job.skills && job.skills.length > 0) 
    ? job.skills 
    : ["JavaScript", "React", "Node.js"];

  const matchedSkills = [];
  const missingSkills = [];

  jobSkills.forEach((skill) => {
    const sLower = skill.toLowerCase().trim();
    if (userSkillsSet.has(sLower)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // 1. Skill Match Score (0 - 100)
  const skillRatio = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) : 1;
  const skillMatchScore = Math.round(skillRatio * 100);

  // 2. Role Match
  const jobTitleLower = (job.title || "").toLowerCase();
  const targetRoleLower = targetRole.toLowerCase();
  
  const roleKeywords = targetRoleLower.split(/\s+/).filter(w => w.length > 2);
  const roleMatch = roleKeywords.some(kw => jobTitleLower.includes(kw)) || jobTitleLower.includes(targetRoleLower);

  // 3. Experience Match
  const expMatch = isExperienceCompatible(userExperience, job.experienceLevel);

  // 4. Location & Remote Preference Match
  const isRemotePreferred = (candidateContext.workType || "").toLowerCase().includes("remote") ||
                            (candidateContext.preferredJobType || "").toLowerCase().includes("remote");
  
  const isJobRemote = Boolean(job.location?.remote);
  const locationMatch = !isRemotePreferred || isJobRemote;

  // Weighted CareerOS Match Calculation
  // 50% Skills + 25% Role + 15% Experience + 10% Location
  let totalScore = (skillMatchScore * 0.50);
  if (roleMatch) totalScore += 25;
  if (expMatch) totalScore += 15;
  if (locationMatch) totalScore += 10;

  const finalMatchScore = Math.min(99, Math.max(35, Math.round(totalScore)));

  // Generate Match Reasons
  const reasons = [];
  if (roleMatch) {
    reasons.push(`Job title "${job.title}" aligns directly with your target role "${targetRole}"`);
  } else {
    reasons.push(`Role relates to software engineering in your domain`);
  }

  if (matchedSkills.length > 0) {
    reasons.push(`You possess ${matchedSkills.length} of ${jobSkills.length} required skills (${matchedSkills.slice(0, 4).join(", ")})`);
  }

  if (expMatch) {
    reasons.push(`Required experience (${job.experienceLevel || "Mid-Level"}) matches your background (${userExperience})`);
  }

  if (isJobRemote) {
    reasons.push(`Offers remote work flexibility`);
  } else if (job.location?.raw) {
    reasons.push(`Location specified as ${job.location.raw}`);
  }

  // Skill Gaps & Roadmap Recommendations
  const skillGaps = missingSkills.map((missingSkill) => ({
    skill: missingSkill,
    reason: `"${missingSkill}" is requested in the job description but not currently listed in your Career DNA or Resume skills.`,
    recommendation: `Add a project or complete a learning module covering ${missingSkill} to increase your match percentage.`
  }));

  return {
    matchScore: finalMatchScore,
    matchedSkills,
    missingSkills,
    roleMatch,
    experienceMatch: expMatch,
    locationMatch,
    reasons,
    skillGaps
  };
}

function isExperienceCompatible(userLevel = "Intermediate", jobLevel = "Mid-Level") {
  const normUser = userLevel.toLowerCase();
  const normJob = (jobLevel || "").toLowerCase();

  if (normUser === "advanced" || normUser === "senior") return true;
  if (normUser === "intermediate" && (normJob.includes("mid") || normJob.includes("entry") || normJob.includes("junior"))) return true;
  if (normUser === "beginner" && (normJob.includes("entry") || normJob.includes("junior"))) return true;

  return false;
}

module.exports = {
  evaluateJobMatch,
  isExperienceCompatible
};
