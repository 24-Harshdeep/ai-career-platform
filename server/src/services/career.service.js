const User = require("../models/User");
const CareerProfile = require("../models/CareerProfile");
const { mockDb } = require("../config/mockDb");

const { calculateCareerScore } = require("../engines/careerScore.engine");
const { computeNextBestAction } = require("../engines/nextBestAction.engine");
const { calculateReadiness } = require("../engines/readiness.engine");
const { generateTimeline } = require("../engines/timeline.engine");
const { calculateSkillGaps } = require("../engines/skillGap.engine");

const { toCareerProfileDTO } = require("../dto/careerProfile.dto");
const { toUserDTO } = require("../dto/user.dto");

// Helper to count flat skills in segmented structure
function getSkillsCount(skillsObj) {
  if (!skillsObj) return 0;
  return [
    ...(skillsObj.technical || []),
    ...(skillsObj.soft || []),
    ...(skillsObj.tools || []),
    ...(skillsObj.frameworks || []),
    ...(skillsObj.languages || []),
    ...(skillsObj.cloud || []),
    ...(skillsObj.devops || [])
  ].length;
}

// 1. Get profile details
async function getProfile(userId) {
  try {
    let profile = await CareerProfile.findOne({ userId });
    if (!profile) {
      profile = await CareerProfile.create({ userId });
    }
    return toCareerProfileDTO(profile);
  } catch (err) {
    // Offline local fallback
    return toCareerProfileDTO(mockDb.profile);
  }
}

// 2. Update profile details
async function updateProfile(userId, profileData) {
  try {
    let profile = await CareerProfile.findOne({ userId });
    if (!profile) {
      profile = new CareerProfile({ userId });
    }

    // Merge parameters
    if (profileData.targetRole) {
      profile.targetRole = profileData.targetRole;
      // Mirror target role on User record too
      await User.findByIdAndUpdate(userId, { role: profileData.targetRole, goal: profileData.targetRole });
    }
    if (profileData.experienceLevel) {
      profile.experienceLevel = profileData.experienceLevel;
      await User.findByIdAndUpdate(userId, { experience: profileData.experienceLevel });
    }
    if (profileData.careerGoal) profile.careerGoal = profileData.careerGoal;
    if (profileData.currentPhase) profile.currentPhase = profileData.currentPhase;
    if (profileData.preferredLearningStyle) profile.preferredLearningStyle = profileData.preferredLearningStyle;
    if (profileData.preferredJobType) profile.preferredJobType = profileData.preferredJobType;
    if (profileData.targetCompanies) profile.targetCompanies = profileData.targetCompanies;
    if (profileData.isOnboardingComplete !== undefined) profile.isOnboardingComplete = profileData.isOnboardingComplete;
    if (profileData.aiPersonality) profile.aiPersonality = profileData.aiPersonality;
    if (profileData.aiResponseLength) profile.aiResponseLength = profileData.aiResponseLength;
    if (profileData.aiRecommendationFreq) profile.aiRecommendationFreq = profileData.aiRecommendationFreq;
    if (profileData.aiTemperature !== undefined) profile.aiTemperature = profileData.aiTemperature;
    if (profileData.preferredIndustry) profile.preferredIndustry = profileData.preferredIndustry;
    if (profileData.countryLocale) profile.countryLocale = profileData.countryLocale;
    if (profileData.targetSalary) profile.targetSalary = profileData.targetSalary;
    if (profileData.workType) profile.workType = profileData.workType;

    await profile.save();

    // Trigger stats recalculation
    await recalculateUserStats(userId);

    return toCareerProfileDTO(profile);
  } catch (err) {
    // Offline local fallback
    if (profileData.targetRole) {
      mockDb.profile.targetRole = profileData.targetRole;
      mockDb.user.role = profileData.targetRole;
      mockDb.user.goal = profileData.targetRole;
    }
    if (profileData.experienceLevel) {
      mockDb.profile.experienceLevel = profileData.experienceLevel;
      mockDb.user.experience = profileData.experienceLevel;
    }
    if (profileData.careerGoal) mockDb.profile.careerGoal = profileData.careerGoal;
    if (profileData.preferredLearningStyle) mockDb.profile.preferredLearningStyle = profileData.preferredLearningStyle;
    if (profileData.targetCompanies) mockDb.profile.targetCompanies = profileData.targetCompanies;
    if (profileData.isOnboardingComplete !== undefined) mockDb.profile.isOnboardingComplete = profileData.isOnboardingComplete;

    return toCareerProfileDTO(mockDb.profile);
  }
}

// 3. Update skills inventories
async function updateSkills(userId, possessed, target) {
  try {
    let profile = await CareerProfile.findOne({ userId });
    if (!profile) {
      profile = new CareerProfile({ userId });
    }

    if (possessed) profile.skillsPossessed = { ...profile.skillsPossessed, ...possessed };
    if (target) profile.skillsTarget = { ...profile.skillsTarget, ...target };

    await profile.save();

    // Count skills count and update User record
    const count = getSkillsCount(profile.skillsPossessed);
    await User.findByIdAndUpdate(userId, { skillsCount: count });

    // Trigger stats recalculation
    await recalculateUserStats(userId);

    return toCareerProfileDTO(profile);
  } catch (err) {
    // Offline local fallback
    if (possessed) mockDb.profile.skillsPossessed = { ...mockDb.profile.skillsPossessed, ...possessed };
    if (target) mockDb.profile.skillsTarget = { ...mockDb.profile.skillsTarget, ...target };
    mockDb.user.skillsCount = getSkillsCount(mockDb.profile.skillsPossessed);
    return toCareerProfileDTO(mockDb.profile);
  }
}

// 4. Calculate stats using pure engines
async function getCareerStats(userId) {
  try {
    const User = require("../models/User");
    const CareerProfile = require("../models/CareerProfile");
    const ResumeAnalysis = require("../models/ResumeAnalysis");
    const roadmapService = require("./roadmap.service");

    const user = await User.findById(userId);
    const profile = await CareerProfile.findOne({ userId }) || { skillsPossessed: {} };

    // Fetch latest real resume analysis score
    const latestAnalysis = await ResumeAnalysis.findOne({ userId }).sort({ analyzedAt: -1 });
    const resumeScore = latestAnalysis ? latestAnalysis.atsScore : 82;
    const hasResumeScanned = latestAnalysis ? true : (user ? user.hasResumeScanned : false);

    // Fetch actual roadmap tracks and compute real average progress
    const actualTracks = await roadmapService.getUserRoadmapTracks(userId);
    let roadmapAvg = 0;
    if (actualTracks && actualTracks.length > 0) {
      const sum = actualTracks.reduce((acc, t) => acc + (t.progress || 0), 0);
      roadmapAvg = Math.round(sum / actualTracks.length);
    } else {
      roadmapAvg = 0;
    }

    const hasGithubScanned = user ? user.hasGithubScanned : false;
    const projectsCount = user ? user.projectsCount : 3;
    const masteredQuestionsCount = user ? user.masteredQuestionsCount : 1;
    const streakDays = user ? user.streakDays : 7;
    const skillsCount = getSkillsCount(profile.skillsPossessed);

    // Trigger score engine
    const scoreData = calculateCareerScore({
      hasResumeScanned,
      hasGithubScanned,
      projectsCount,
      skillsCount,
      roadmapAverageProgress: roadmapAvg,
      applicationsCount: 3, // mock application pipeline count
      masteredQuestionsCount,
      streakDays
    });

    const nextAction = computeNextBestAction({
      hasResumeScanned,
      hasGithubScanned,
      hasCompletedM1: false, // mock mission status
      hasCompletedM2: false,
      targetGoal: user ? user.goal : "Full Stack Developer"
    });

    const readiness = calculateReadiness({
      careerScore: scoreData.score,
      hasResumeScanned,
      hasGithubScanned,
      projectsCount,
      masteredQuestionsCount,
      resumeScore // Pass real parsed ATS score!
    });

    const timeline = generateTimeline({
      hasResumeScanned,
      hasGithubScanned,
      roadmapAverageProgress: roadmapAvg,
      hasOfferSecured: true // mock offer status
    });

    // Update User Score in MongoDB
    if (user && user.score !== scoreData.score) {
      user.score = scoreData.score;
      await user.save();
    }

    return {
      score: scoreData.score,
      breakdown: scoreData.breakdown,
      nextAction,
      readiness,
      timeline
    };
  } catch (err) {
    // Offline local fallback
    const roadmapAvg = 61.6;
    const scoreData = calculateCareerScore({
      hasResumeScanned: mockDb.user.hasResumeScanned,
      hasGithubScanned: mockDb.user.hasGithubScanned,
      projectsCount: mockDb.user.projectsCount,
      skillsCount: getSkillsCount(mockDb.profile.skillsPossessed),
      roadmapAverageProgress: roadmapAvg,
      applicationsCount: mockDb.applications.length,
      masteredQuestionsCount: mockDb.user.masteredQuestionsCount,
      streakDays: mockDb.user.streakDays
    });

    const nextAction = computeNextBestAction({
      hasResumeScanned: mockDb.user.hasResumeScanned,
      hasGithubScanned: mockDb.user.hasGithubScanned,
      hasCompletedM1: mockDb.missions.find(m => m.id === "m-1").completed,
      hasCompletedM2: mockDb.missions.find(m => m.id === "m-2").completed,
      targetGoal: mockDb.user.goal
    });

    const readiness = calculateReadiness({
      careerScore: scoreData.score,
      hasResumeScanned: mockDb.user.hasResumeScanned,
      hasGithubScanned: mockDb.user.hasGithubScanned,
      projectsCount: mockDb.user.projectsCount,
      masteredQuestionsCount: mockDb.user.masteredQuestionsCount
    });

    const hasOffer = mockDb.applications.some(a => a.status === "Offer");
    const timeline = generateTimeline({
      hasResumeScanned: mockDb.user.hasResumeScanned,
      hasGithubScanned: mockDb.user.hasGithubScanned,
      roadmapAverageProgress: roadmapAvg,
      hasOfferSecured: hasOffer
    });

    mockDb.user.score = scoreData.score;

    return {
      score: scoreData.score,
      breakdown: scoreData.breakdown,
      nextAction,
      readiness,
      timeline
    };
  }
}

// Recalculates user stats and saves score to User record
async function recalculateUserStats(userId) {
  const stats = await getCareerStats(userId);
  return stats;
}

module.exports = {
  getProfile,
  updateProfile,
  updateSkills,
  getCareerStats,
  recalculateUserStats
};
