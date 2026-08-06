function toCareerProfileDTO(profile) {
  if (!profile) return null;
  return {
    targetRole: profile.targetRole,
    experienceLevel: profile.experienceLevel,
    careerGoal: profile.careerGoal,
    currentPhase: profile.currentPhase,
    strengths: profile.strengths || [],
    weaknesses: profile.weaknesses || [],
    skillsPossessed: profile.skillsPossessed || {
      technical: [], soft: [], tools: [], frameworks: [], languages: [], cloud: [], devops: []
    },
    skillsTarget: profile.skillsTarget || {
      technical: [], soft: [], tools: [], frameworks: [], languages: [], cloud: [], devops: []
    },
    preferredLearningStyle: profile.preferredLearningStyle,
    preferredJobType: profile.preferredJobType,
    targetCompanies: profile.targetCompanies || [],
    isOnboardingComplete: profile.isOnboardingComplete || false,
    aiPersonality: profile.aiPersonality || "Career Coach",
    aiResponseLength: profile.aiResponseLength || "Detailed",
    aiRecommendationFreq: profile.aiRecommendationFreq || "Daily",
    aiTemperature: profile.aiTemperature !== undefined ? profile.aiTemperature : 0.5,
    preferredIndustry: profile.preferredIndustry || "Fintech",
    countryLocale: profile.countryLocale || "United States",
    targetSalary: profile.targetSalary || "$130,000",
    workType: profile.workType || "Remote",
    githubUrl: profile.githubUrl || "",
    themeMode: profile.themeMode || "Dark",
    accentColor: profile.accentColor || "Purple",
    primaryResume: profile.primaryResume || "Harshdeep_Resume_2026.pdf",
    primaryPortfolio: profile.primaryPortfolio || "GitHub Integration Portfolio",
    linkedinUrl: profile.linkedinUrl || "",
    portfolioUrl: profile.portfolioUrl || "",
    updatedAt: profile.updatedAt
  };
}

module.exports = { toCareerProfileDTO };
