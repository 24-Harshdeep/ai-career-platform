/**
 * Job Matching Service
 * 7-Factor Transparent CareerOS Scoring Engine with subscore breakdown,
 * seniority penalties, and Roadmap skill status mapping.
 */

/**
 * Robustly extracts and flattens all candidate skills from candidate context.
 */
function extractUserSkills(candidateContext = {}) {
  const userSkillsSet = new Set();
  
  const sources = [
    candidateContext.skillsPossessed,
    candidateContext.skillsTarget,
    candidateContext.skills,
    candidateContext.resumeContext?.identifiedSkills,
    candidateContext.strengths
  ];

  function addSkill(s) {
    if (typeof s === "string" && s.trim()) {
      userSkillsSet.add(s.toLowerCase().trim());
    }
  }

  function traverse(val) {
    if (!val) return;
    if (typeof val === "string") {
      val.split(/[,;\n]/).forEach(addSkill);
    } else if (Array.isArray(val)) {
      val.forEach(traverse);
    } else if (typeof val === "object") {
      Object.values(val).forEach(traverse);
    }
  }

  sources.forEach(traverse);
  return userSkillsSet;
}

/**
 * Evaluates candidate career context against a normalized Job.
 * Computes deterministic CareerOS 7-Factor Match score, subscores, skill gaps,
 * and roadmap integration status.
 *
 * @param {Object} candidateContext - User career context from getCareerContext()
 * @param {Object} job - Normalized Job object
 * @param {Object} roadmapProgressMap - Map of skillId/subSkillId to status ({ completed: Set, inProgress: Set })
 * @returns {Object} Structured match results
 */
function evaluateJobMatch(candidateContext = {}, job = {}, roadmapProgressMap = { completed: new Set(), inProgress: new Set() }) {
  const targetRole = candidateContext.targetRole || "Software Engineer";
  const userExperience = candidateContext.experienceLevel || "Mid-Level";
  
  // Extract all candidate possessed skills
  const userSkillsSet = extractUserSkills(candidateContext);

  // Job Required & Preferred Skills
  const requiredSkills = (job.requiredSkills && job.requiredSkills.length > 0)
    ? job.requiredSkills
    : (job.skills && job.skills.length > 0 ? job.skills : ["JavaScript", "React", "Node.js"]);

  const preferredSkills = job.preferredSkills || [];

  const matchedSkills = [];
  const missingSkills = [];

  requiredSkills.forEach((skill) => {
    const sLower = skill.toLowerCase().trim();
    if (userSkillsSet.has(sLower)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // Factor 1: Role Compatibility (Weight: 25%)
  let roleScore = 0;
  const jobTitleLower = (job.title || "").toLowerCase();
  const targetRoleLower = targetRole.toLowerCase();
  const jobRoleFamily = (job.roleFamily || "").toLowerCase();

  const isFullstackTarget = targetRoleLower.includes("fullstack") || targetRoleLower.includes("full stack");
  const isFrontendTarget = targetRoleLower.includes("frontend") || targetRoleLower.includes("front end");
  const isBackendTarget = targetRoleLower.includes("backend") || targetRoleLower.includes("back end");

  if (jobTitleLower.includes(targetRoleLower) || targetRoleLower.includes(jobTitleLower)) {
    roleScore = 25;
  } else if (isFullstackTarget && (jobRoleFamily.includes("frontend") || jobRoleFamily.includes("backend") || jobRoleFamily.includes("fullstack"))) {
    roleScore = 22;
  } else if (jobRoleFamily && targetRoleLower.includes(jobRoleFamily.split(" ")[0].toLowerCase())) {
    roleScore = 22;
  } else {
    const roleKeywords = targetRoleLower.split(/\s+/).filter(w => w.length > 2);
    const matchesCount = roleKeywords.filter(kw => jobTitleLower.includes(kw)).length;
    if (matchesCount > 0) {
      roleScore = Math.min(25, 14 + matchesCount * 4);
    } else {
      roleScore = 12;
    }
  }

  // Factor 2: Seniority Fit (Weight: 20%) & Penalty Calculation
  let seniorityScore = 20;
  let seniorityPenalty = 0;

  const jobSeniority = (job.seniority || job.experienceLevel || "Mid-Level").toLowerCase();
  const candSeniority = userExperience.toLowerCase();

  if (candSeniority.includes("senior") || candSeniority.includes("advanced") || candSeniority.includes("lead")) {
    if (jobSeniority.includes("intern") || jobSeniority.includes("graduate") || jobSeniority.includes("entry")) {
      seniorityScore = 5;
      seniorityPenalty = 15;
    } else {
      seniorityScore = 20;
    }
  } else if (candSeniority.includes("mid") || candSeniority.includes("intermediate")) {
    if (jobSeniority.includes("senior") || jobSeniority.includes("lead")) {
      seniorityScore = 14;
    } else if (jobSeniority.includes("intern")) {
      seniorityScore = 10;
    } else {
      seniorityScore = 20;
    }
  } else {
    // Beginner / Junior / Intern candidate
    if (jobSeniority.includes("lead") || jobSeniority.includes("staff") || jobSeniority.includes("principal")) {
      seniorityScore = 2;
      seniorityPenalty = 15;
    } else if (jobSeniority.includes("senior")) {
      seniorityScore = 8;
      seniorityPenalty = 10;
    } else {
      seniorityScore = 20;
    }
  }

  // Factor 3: Required Skills Overlap (Weight: 20%)
  const skillRatio = requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) : 0.5;
  const requiredSkillsScore = Math.round(skillRatio * 20);

  // Factor 4: Experience Fit (Weight: 15%)
  const experienceScore = Math.round(isExperienceCompatible(userExperience, job.experienceLevel) ? 15 : 8);

  // Factor 5: Location & Remote Fit (Weight: 10%)
  let locationScore = 10;
  if (job.country && job.country === "India") {
    locationScore = 10;
  } else if (job.remoteType === "Remote" || job.location?.remote) {
    locationScore = 10;
  } else {
    locationScore = 6;
  }

  // Factor 6: Freshness Score (Weight: 5%)
  let freshnessScore = 5;
  if (job.publishedAt) {
    const ageDays = (new Date().getTime() - new Date(job.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays <= 3) freshnessScore = 5;
    else if (ageDays <= 7) freshnessScore = 4;
    else if (ageDays <= 14) freshnessScore = 3;
    else if (ageDays <= 30) freshnessScore = 2;
    else freshnessScore = 1;
  }

  // Factor 7: Trajectory Alignment (Weight: 5%)
  let trajectoryScore = 3;
  const targetSkills = candidateContext.skillsTarget || [];
  const targetSkillsList = Array.isArray(targetSkills) ? targetSkills : Object.values(targetSkills).flat();
  
  const hasTargetSkillMatch = targetSkillsList.some(ts => 
    requiredSkills.some(rs => rs.toLowerCase().includes(String(ts).toLowerCase()))
  );

  if (hasTargetSkillMatch || roleScore >= 20) {
    trajectoryScore = 5;
  }

  // Calculate Raw & Final Net Score after Seniority Penalty
  const rawTotalScore = roleScore + seniorityScore + requiredSkillsScore + experienceScore + locationScore + freshnessScore + trajectoryScore;
  const netScore = Math.max(0, rawTotalScore - seniorityPenalty);
  const finalMatchScore = Math.min(99, Math.max(25, Math.round(netScore)));

  const subscores = {
    role: roleScore,
    seniority: seniorityScore,
    requiredSkills: requiredSkillsScore,
    experience: experienceScore,
    location: locationScore,
    freshness: freshnessScore,
    trajectory: trajectoryScore,
    seniorityPenalty: seniorityPenalty
  };

  // Reasons Breakdown
  const reasons = [];
  reasons.push(`Role Match (${roleScore}/25): Title "${job.title}" aligns with target "${targetRole}"`);
  reasons.push(`Seniority Fit (${seniorityScore}/20): Required "${job.seniority || job.experienceLevel || "Mid-Level"}" vs candidate level "${userExperience}"${seniorityPenalty ? ` (Applied -${seniorityPenalty} penalty)` : ""}`);
  reasons.push(`Required Skills (${requiredSkillsScore}/20): Possess ${matchedSkills.length} of ${requiredSkills.length} core required skills`);
  reasons.push(`Experience Fit (${experienceScore}/15): Compatible career track requirement`);
  reasons.push(`Location Fit (${locationScore}/10): ${job.normalizedLocation || job.location?.raw || "Remote"}`);
  reasons.push(`Freshness (${freshnessScore}/5): Posted recently`);
  reasons.push(`Career Trajectory (${trajectoryScore}/5): Aligns with growth path`);

  // Skill Gaps & Roadmap Status Integration
  const roadmapSkillStatus = {};
  const skillGaps = missingSkills.map((missingSkill) => {
    const sLower = missingSkill.toLowerCase().trim();
    let status = "Not Started";

    if (roadmapProgressMap.completed && roadmapProgressMap.completed.has(sLower)) {
      status = "Completed";
    } else if (roadmapProgressMap.inProgress && roadmapProgressMap.inProgress.has(sLower)) {
      status = "In Progress";
    }

    roadmapSkillStatus[missingSkill] = status;

    return {
      skill: missingSkill,
      roadmapStatus: status,
      reason: `"${missingSkill}" is requested in the job description but not currently listed in your Career DNA or Resume skills.`,
      recommendation: status === "Completed"
        ? `Skill marked completed on your roadmap! Update your Career Profile to reflect this.`
        : status === "In Progress"
        ? `You are currently working on this skill in your Roadmap.`
        : `Add a project or complete a learning module covering ${missingSkill} to increase your match percentage.`
    };
  });

  return {
    matchScore: finalMatchScore,
    subscores,
    matchedSkills,
    missingSkills,
    preferredSkills,
    roleMatch: roleScore >= 18,
    experienceMatch: seniorityScore >= 12,
    locationMatch: locationScore >= 8,
    reasons,
    skillGaps,
    roadmapSkillStatus
  };
}

function isExperienceCompatible(userLevel = "Intermediate", jobLevel = "Mid-Level") {
  const normUser = userLevel.toLowerCase();
  const normJob = (jobLevel || "").toLowerCase();

  if (normUser.includes("senior") || normUser.includes("advanced") || normUser.includes("lead")) return true;
  if (normUser.includes("mid") || normUser.includes("intermediate")) {
    return normJob.includes("mid") || normJob.includes("entry") || normJob.includes("junior");
  }
  if (normUser.includes("beginner") || normUser.includes("junior")) {
    return normJob.includes("entry") || normJob.includes("junior") || normJob.includes("intern");
  }

  return true;
}

module.exports = {
  extractUserSkills,
  evaluateJobMatch,
  isExperienceCompatible
};
