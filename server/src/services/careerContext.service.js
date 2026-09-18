const User = require("../models/User");
const CareerProfile = require("../models/CareerProfile");
const Resume = require("../models/Resume");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const GithubRepository = require("../models/GithubRepository");
const GithubRepositoryAnalysis = require("../models/GithubRepositoryAnalysis");
const DeveloperProfile = require("../models/DeveloperProfile");
const JobOpportunity = require("../models/JobOpportunity");
const Recommendation = require("../models/Recommendation");

/**
 * Gathers the entire career state into a single cohesive context object.
 * This is the "One Career Context" that drives all AI intelligence.
 */
async function getCareerContext(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const profile = await CareerProfile.findOne({ userId });
    
    // Resume context
    const latestResume = await Resume.findOne({ userId }).sort({ uploadDate: -1 });
    let resumeContext = null;
    if (latestResume) {
      const analysis = await ResumeAnalysis.findOne({ resumeId: latestResume._id });
      resumeContext = {
        atsScore: analysis ? analysis.atsScore : 0,
        missingKeywords: analysis ? analysis.missingKeywords : [],
        identifiedSkills: analysis ? analysis.identifiedSkills : []
      };
    }

    // Developer Profile context
    const devProfile = await DeveloperProfile.findOne({ userId });
    let devContext = null;
    if (devProfile) {
      devContext = {
        overallHealth: devProfile.overallHealth,
        engineeringLevel: devProfile.engineeringLevel,
        missingPractices: devProfile.missingPractices,
        languageDistribution: devProfile.languageDistribution
      };
    }

    // Active Jobs
    const activeJobs = await JobOpportunity.find({ 
      userId, 
      status: { $in: ["Saved", "Applied", "Interviewing", "Offer"] } 
    }).sort({ updatedAt: -1 }).limit(5);

    // Active Recommendations
    const activeRecommendations = await Recommendation.find({ 
      userId, 
      status: "Active" 
    });

    const contextObj = {
      userId: user._id.toString(),
      targetRole: profile ? profile.targetRole : user.goal,
      experienceLevel: profile ? profile.experienceLevel : user.experience,
      careerScore: user.score,
      careerGoal: profile ? profile.careerGoal : "",
      strengths: profile ? profile.strengths : [],
      weaknesses: profile ? profile.weaknesses : [],
      skillsPossessed: profile ? profile.skillsPossessed : {},
      skillsTarget: profile ? profile.skillsTarget : {},
      resumeContext,
      devContext,
      activeJobs: activeJobs.map(j => ({
        company: j.company,
        role: j.roleTitle,
        status: j.status
      })),
      activeRecommendations: activeRecommendations.map(r => ({
        actionId: r.actionId,
        title: r.title,
        type: r.type
      }))
    };

    // Attach Machine Learning Candidate Readiness Prediction
    try {
      const { predictCandidateReadiness } = require("../engines/ml/readinessModel");
      const mlPrediction = predictCandidateReadiness({
        resumeScore: resumeContext ? resumeContext.atsScore : 0,
        githubHealth: devContext ? devContext.overallHealth : 0,
        skillsPossessed: profile ? profile.skillsPossessed : {},
        skillsTarget: profile ? profile.skillsTarget : [],
        interviewScore: user.score || 0,
        userStreak: user.streakDays || 0,
        projectsCount: devProfile ? devProfile.repositoryCount || 0 : 0
      });
      contextObj.mlReadinessPrediction = mlPrediction;
    } catch (mlErr) {
      console.error("ML Prediction calculation error:", mlErr.message);
    }

    return contextObj;
  } catch (err) {
    console.error("Error building Career Context:", err);
    throw err;
  }
}

module.exports = {
  getCareerContext
};
