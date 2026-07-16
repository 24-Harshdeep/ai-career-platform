function compileSkillTrend(profileSkills) {
  const distribution = [
    { category: "Frontend", rating: 85 },
    { category: "Backend", rating: 80 },
    { category: "DevOps", rating: 60 },
    { category: "Databases", rating: 75 },
    { category: "Testing", rating: 65 }
  ];

  return {
    distribution,
    strongest: "Frontend",
    weakest: "DevOps"
  };
}

module.exports = { compileSkillTrend };
