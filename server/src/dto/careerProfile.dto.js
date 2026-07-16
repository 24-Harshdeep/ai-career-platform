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
    updatedAt: profile.updatedAt
  };
}

module.exports = { toCareerProfileDTO };
