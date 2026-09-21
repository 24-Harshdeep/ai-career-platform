const User = require("../models/User");
const CareerProfile = require("../models/CareerProfile");


const { calculateCareerScore } = require("../engines/careerScore.engine");
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
    console.error("Career Service Error in getProfile:", err);
    throw err;
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
    if (profileData.githubUrl !== undefined) profile.githubUrl = profileData.githubUrl;
    if (profileData.themeMode) profile.themeMode = profileData.themeMode;
    if (profileData.accentColor) profile.accentColor = profileData.accentColor;
    if (profileData.primaryResume) profile.primaryResume = profileData.primaryResume;
    if (profileData.primaryPortfolio) profile.primaryPortfolio = profileData.primaryPortfolio;
    if (profileData.linkedinUrl !== undefined) profile.linkedinUrl = profileData.linkedinUrl;
    if (profileData.portfolioUrl !== undefined) profile.portfolioUrl = profileData.portfolioUrl;

    if (profileData.name || profileData.email) {
      const userUpdate = {};
      if (profileData.name) userUpdate.name = profileData.name;
      if (profileData.email) userUpdate.email = profileData.email;
      await User.findByIdAndUpdate(userId, userUpdate);
    }

    await profile.save();

    // Log PROFILE_UPDATED CareerEvent
    try {
      const CareerEvent = require("../models/CareerEvent");
      await CareerEvent.create({
        userId,
        eventType: "PROFILE_UPDATED",
        source: "SETTINGS",
        metadata: {
          targetRole: profile.targetRole,
          careerGoal: profile.careerGoal,
          experienceLevel: profile.experienceLevel
        }
      });
    } catch (evtErr) {
      console.error("Failed to log PROFILE_UPDATED event:", evtErr.message);
    }

    // Trigger stats recalculation
    await recalculateUserStats(userId);

    return toCareerProfileDTO(profile);
  } catch (err) {
    console.error("Career Service Error in updateProfile:", err);
    throw err;
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
    console.error("Career Service Error in updateSkills:", err);
    throw err;
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
    const resumeScore = latestAnalysis ? latestAnalysis.atsScore : 0;
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
    const projectsCount = user ? user.projectsCount : 0;
    const masteredQuestionsCount = user ? user.masteredQuestionsCount : 0;
    const streakDays = user ? user.streakDays : 0;
    const skillsCount = getSkillsCount(profile.skillsPossessed);

    const JobOpportunity = require("../models/JobOpportunity");
    const InterviewSession = require("../models/InterviewSession");

    const applicationsCount = await JobOpportunity.countDocuments({ userId });
    const offerCount = await JobOpportunity.countDocuments({ userId, status: "Offer" });
    
    // Fetch average interview score from completed interview sessions
    const completedSessions = await InterviewSession.find({ userId, overallScore: { $gt: 0 } });
    let interviewScore = 0;
    if (completedSessions.length > 0) {
      interviewScore = Math.round(
        completedSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / completedSessions.length
      );
    }

    // Trigger score engine
    const scoreData = calculateCareerScore({
      hasResumeScanned,
      hasGithubScanned,
      projectsCount,
      skillsCount,
      roadmapAverageProgress: roadmapAvg,
      applicationsCount,
      masteredQuestionsCount: Math.max(masteredQuestionsCount, completedSessions.length * 3),
      streakDays
    });

    const readiness = calculateReadiness({
      careerScore: scoreData.score,
      hasResumeScanned,
      hasGithubScanned,
      projectsCount,
      masteredQuestionsCount,
      resumeScore, // Pass real parsed ATS score!
      interviewScore
    });

    const timeline = generateTimeline({
      hasResumeScanned,
      hasGithubScanned,
      roadmapAverageProgress: roadmapAvg,
      hasOfferSecured: offerCount > 0
    });

    // Update User Score in MongoDB
    if (user && user.score !== scoreData.score) {
      user.score = scoreData.score;
      await user.save();
    }

    return {
      score: scoreData.score,
      breakdown: scoreData.breakdown,
      nextAction: [],
      readiness,
      timeline
    };
  } catch (err) {
    console.error("Career Service Error in getCareerStats:", err);
    throw err;
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
