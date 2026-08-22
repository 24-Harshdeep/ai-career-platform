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
    aiPersonality: profile.aiPersonality || "",
    aiResponseLength: profile.aiResponseLength || "",
    aiRecommendationFreq: profile.aiRecommendationFreq || "",
    aiTemperature: profile.aiTemperature !== undefined ? profile.aiTemperature : 0.5,
    preferredIndustry: profile.preferredIndustry || "",
    countryLocale: profile.countryLocale || "",
    targetSalary: profile.targetSalary || "",
    workType: profile.workType || "",
    githubUrl: profile.githubUrl || "",
    themeMode: profile.themeMode || "Dark",
    accentColor: profile.accentColor || "Purple",
    primaryResume: profile.primaryResume || "",
    primaryPortfolio: profile.primaryPortfolio || "",
    linkedinUrl: profile.linkedinUrl || "",
    portfolioUrl: profile.portfolioUrl || "",
    updatedAt: profile.updatedAt
  };
}

module.exports = { toCareerProfileDTO };
