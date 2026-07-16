function auditResumeGaps(jdSkills, parsedResumeText) {
  const text = (parsedResumeText || "").toLowerCase();
  const missing = (jdSkills || []).filter(skill => !text.includes(skill.toLowerCase()));

  const score = jdSkills && jdSkills.length > 0 
    ? Math.round(((jdSkills.length - missing.length) / jdSkills.length) * 100)
    : 80;

  return {
    score: Math.min(100, Math.max(30, score)),
    missing
  };
}

module.exports = { auditResumeGaps };
