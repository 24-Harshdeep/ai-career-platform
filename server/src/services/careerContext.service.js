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
 * Helper to dynamically resolve candidate career goal with role-aligned fallbacks.
 */
function resolveCareerGoal(profileGoal, userGoal, targetRole = "Full Stack Developer") {
  if (profileGoal && typeof profileGoal === "string" && profileGoal.trim() && profileGoal.trim() !== "Not available") {
    return profileGoal.trim();
  }
  if (userGoal && typeof userGoal === "string" && userGoal.trim() && userGoal.trim() !== "Not available" && userGoal.trim() !== targetRole) {
    return userGoal.trim();
  }

  const roleLower = (targetRole || "").toLowerCase();
  if (roleLower.includes("full stack") || roleLower.includes("fullstack")) {
    return "Master Full Stack Engineering & Lead Scalable Web Application Development";
  }
  if (roleLower.includes("frontend")) {
    return "Architect High-Performance Modern Web Applications & Responsive UIs";
  }
  if (roleLower.includes("backend")) {
    return "Design High-Throughput Distributed Systems & Resilient APIs";
  }
  if (roleLower.includes("devops") || roleLower.includes("cloud") || roleLower.includes("sre")) {
    return "Automate CI/CD Pipelines & Cloud Infrastructure at Scale";
  }
  if (roleLower.includes("data") || roleLower.includes("machine learning") || roleLower.includes("ai")) {
    return "Engineer Scalable Data Pipelines & Intelligent Systems";
  }
  return `Advance as a ${targetRole || "Software Engineer"} & Build High-Impact Systems`;
}

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

    // Active Jobs (Queries multi-source JobApplication first, with JobOpportunity fallback)
    const JobApplication = require("../models/JobApplication");
    const userApplications = await JobApplication.find({ userId }).populate("jobId").sort({ updatedAt: -1 }).limit(10);

    let activeJobsList = [];
    if (userApplications.length > 0) {
      activeJobsList = userApplications
        .filter(app => app.jobId)
        .map(app => ({
          company: app.jobId.company ? app.jobId.company.name : "Company",
          role: app.jobId.title || "Developer",
          status: app.status,
          requiredSkills: app.jobId.requiredSkills || app.jobId.skills || []
        }));
    } else {
      const activeJobs = await JobOpportunity.find({
        userId,
        status: { $in: ["Saved", "Applied", "Interviewing", "Offer"] }
      }).sort({ updatedAt: -1 }).limit(5);
      activeJobsList = activeJobs.map(j => ({
        company: j.company,
        role: j.roleTitle || j.title,
        status: j.status,
        requiredSkills: j.skills || []
      }));
    }

    // Active Recommendations
    const activeRecommendations = await Recommendation.find({
      userId,
      status: "Active"
    });

    // Interview Context
    const InterviewSession = require("../models/InterviewSession");
    const InterviewMistake = require("../models/InterviewMistake");
    const pastSessions = await InterviewSession.find({ userId, overallScore: { $gt: 0 } }).sort({ completedAt: -1 }).limit(10);
    const unresolvedMistakes = await InterviewMistake.find({ userId, resolved: false }).sort({ frequency: -1 }).limit(10);

    let interviewReadinessScore = null;
    if (pastSessions.length > 0) {
      interviewReadinessScore = Math.round(
        pastSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / pastSessions.length
      );
    }

    const interviewContext = {
      completedCount: pastSessions.length,
      averageScore: interviewReadinessScore,
      latestScore: pastSessions.length > 0 ? pastSessions[0].overallScore : null,
      repeatingMistakes: unresolvedMistakes.map(m => ({
        concept: m.concept,
        frequency: m.frequency,
        severity: m.frequency > 1 ? "High" : "Medium"
      }))
    };

    const targetRole = (profile && profile.targetRole) ? profile.targetRole : (user.role || user.goal || "Full Stack Developer");
    const careerGoal = resolveCareerGoal(profile ? profile.careerGoal : "", user ? user.goal : "", targetRole);

    const growthMode = (profile && profile.growthMode) ? profile.growthMode : "JOB_READINESS";
    const userPriorities = (profile && profile.userPriorities) ? profile.userPriorities : [];
    const interests = (profile && profile.interests) ? profile.interests : [];

    // Live Market Signals for target role
    let marketSignals = { sampleSize: 0, topSkills: [], highDemand: [], growingDemand: [] };
    try {
      const { getMarketIntelligence } = require("./marketIntelligence.service");
      marketSignals = await getMarketIntelligence(targetRole, profile ? profile.experienceLevel : "Mid", 30);
    } catch (mErr) {
      console.warn("[CareerContext] Market signals fetch warning:", mErr.message);
    }

    const contextObj = {
      userId: user._id.toString(),
      targetRole,
      growthMode,
      targetOutcome: {
        targetRole,
        growthMode,
        goalDescription: careerGoal,
        targetSalary: profile ? profile.targetSalary : "",
        workType: profile ? profile.workType : ""
      },
      experienceLevel: profile ? profile.experienceLevel : user.experience,
      careerScore: user.score,
      careerGoal,
      strengths: profile ? profile.strengths : [],
      weaknesses: profile ? profile.weaknesses : [],
      skillsPossessed: profile ? profile.skillsPossessed : {},
      skillsTarget: profile ? profile.skillsTarget : {},
      userPriorities,
      interests,
      userCustomGaps: profile ? profile.userCustomGaps : [],
      resumeContext,
      devContext,
      interviewContext,
      activeJobs: activeJobsList,
      activeRecommendations: activeRecommendations.map(r => ({
        actionId: r.actionId,
        title: r.title,
        type: r.type
      })),
      marketSignals
    };

    // Calculate structured evidence-based skill gaps
    try {
      const { evaluateStructuredGaps } = require("../engines/skillGap.engine");
      contextObj.structuredGaps = evaluateStructuredGaps(contextObj);
    } catch (gapErr) {
      console.warn("Structured gap evaluation failed:", gapErr.message);
    }

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
  getCareerContext,
  resolveCareerGoal
};
