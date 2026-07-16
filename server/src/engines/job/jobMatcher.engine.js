function matchJobKeywords(jdSkills, userSkills) {
  const userSkillsLower = (userSkills || []).map(s => s.toLowerCase());
  const missing = (jdSkills || []).filter(skill => !userSkillsLower.includes(skill.toLowerCase()));

  const score = jdSkills && jdSkills.length > 0 
    ? Math.round(((jdSkills.length - missing.length) / jdSkills.length) * 100)
    : 80;

  return {
    score: Math.min(100, Math.max(30, score)),
    missing
  };
}

module.exports = { matchJobKeywords };
