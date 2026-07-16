const User = require("../models/User");
const Resume = require("../models/Resume");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const DeveloperProfile = require("../models/DeveloperProfile");
const InterviewSession = require("../models/InterviewSession");
const CareerEvent = require("../models/CareerEvent");
const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");
const WeeklyReport = require("../models/WeeklyReport");
const Achievement = require("../models/Achievement");
const { mockDb } = require("../config/mockDb");

const { calculateGrowthDeltas } = require("../engines/analytics/careerGrowth.engine");
const { projectFutureScore } = require("../engines/analytics/prediction.engine");
const { compileConsistencyActivity } = require("../engines/analytics/consistency.engine");
const { compileSkillTrend } = require("../engines/analytics/skillTrend.engine");
const { auditMilestonesUnlocks } = require("../engines/analytics/milestone.engine");
const { compileWeeklyReportDigest } = require("../engines/analytics/weeklyReport.engine");

const { toAnalyticsDashboardDTO } = require("../dto/analytics.dto");

// 1. Log Career Activity Event
async function logCareerEvent(userId, eventType, source, pointsEarned, metadata = {}) {
  try {
    await CareerEvent.create({
      userId,
      eventType,
      source,
      pointsEarned,
      metadata
    });
  } catch (err) {
    // Silent offline fail
  }
}

// 2. Fetch Executive Consolidated Analytics Dashboard payload
async function compileDashboardData(userId) {
  try {
    const userDoc = await User.findById(userId);
    const score = userDoc ? userDoc.score : 82;

    const resume = await Resume.findOne({ userId }).sort({ uploadDate: -1 });
    const resumeAnalysis = resume 
      ? await ResumeAnalysis.findOne({ userId, resumeId: resume._id }) 
      : null;
    const devProfile = await DeveloperProfile.findOne({ userId });
    const mockSessions = await InterviewSession.find({ userId, status: "Completed" });

    // Category scores
    const resumeScore = resumeAnalysis ? resumeAnalysis.atsScore : 80;
    const devScore = devProfile ? devProfile.overallHealth : 80;
    const portfolioScore = devProfile ? devProfile.overallHealth : 80;
    const interviewScore = mockSessions.length > 0
      ? Math.round(mockSessions.reduce((acc, curr) => acc + curr.overallScore, 0) / mockSessions.length)
      : 75;

    // Load events
    const events = await CareerEvent.find({ userId }).sort({ createdAt: -1 });
    const snapshots = await AnalyticsSnapshot.find({ userId }).sort({ createdAt: -1 });

    // Execute Engines
    const growthData = calculateGrowthDeltas(score, snapshots);
    const consistencyData = compileConsistencyActivity(events);
    const skills = userDoc ? userDoc.skillsPossessed : ["React", "Express", "Node.js", "MongoDB"];
    const skillTrendData = compileSkillTrend(skills);

    const userStats = {
      hasResumeScanned: !!resume,
      projectsCount: devProfile ? devProfile.repositoryCount : 3
    };
    const unlockedList = auditMilestonesUnlocks(userStats);

    // Save new achievements if not already present
    const existingAchievements = await Achievement.find({ userId });
    for (const badge of unlockedList) {
      const exists = existingAchievements.some(e => e.title === badge.title);
      if (!exists) {
        await Achievement.create({ userId, ...badge });
      }
    }
    const currentAchievements = await Achievement.find({ userId });

    const predictionData = projectFutureScore(score, growthData.weeklyGrowth);
    const weeklyDigest = compileWeeklyReportDigest(events.length, score - (snapshots[0]?.careerScore || 80));

    // Save current Analytics Snapshot
    const currentSnapshot = await AnalyticsSnapshot.create({
      userId,
      careerScore: score,
      resumeScore,
      developerScore: devScore,
      projectScore: portfolioScore,
      roadmapScore: userDoc ? userDoc.roadmapProgress || 50 : 50,
      interviewScore,
      jobReadiness: Math.round((resumeScore + devScore) / 2),
      interviewReadiness: interviewScore,
      portfolioReadiness: portfolioScore,
      weeklyGrowth: growthData.weeklyGrowth,
      monthlyGrowth: growthData.monthlyGrowth
    });

    // Save current Weekly Report digest
    await WeeklyReport.deleteOne({ userId }); // Keep latest
    const savedWeeklyReport = await WeeklyReport.create({
      userId,
      summary: weeklyDigest.summary,
      completedTasksCount: weeklyDigest.completedTasksCount,
      pointsEarned: weeklyDigest.pointsEarned,
      nextWeekFocus: weeklyDigest.nextWeekFocus
    });

    return toAnalyticsDashboardDTO(
      currentSnapshot,
      consistencyData,
      skillTrendData,
      currentAchievements,
      predictionData,
      savedWeeklyReport,
      events
    );
  } catch (err) {
    // Offline local fallback
    const mockSnapshot = {
      careerScore: mockDb.user.score,
      resumeScore: 82,
      developerScore: 80,
      projectScore: 80,
      roadmapScore: 50,
      interviewScore: 75,
      weeklyGrowth: 2,
      monthlyGrowth: 5
    };

    const mockConsistency = {
      streakDays: 3,
      heatMapDays: [1, 0, 2, 0, 1, 1, 0]
    };

    const mockSkillTrend = {
      distribution: [
        { category: "Frontend", rating: 85 },
        { category: "Backend", rating: 80 },
        { category: "DevOps", rating: 60 },
        { category: "Databases", rating: 75 },
        { category: "Testing", rating: 65 }
      ],
      strongest: "Frontend",
      weakest: "DevOps"
    };

    const mockAchievements = [
      { title: "First Resume Uploaded", description: "Uploaded resume to ATS check.", badgeUrl: "/badges/resume.png" }
    ];

    const mockPrediction = {
      targetScore: Math.min(100, mockDb.user.score + 6),
      daysRemaining: 21,
      requiredPractice: "Containerize Express servers and solve mock coding interview tasks."
    };

    const mockWeekly = {
      summary: "Completed 5 checklist items this week.",
      completedTasksCount: 5,
      pointsEarned: 10,
      nextWeekFocus: ["Docker setups", "Jest Testing"]
    };

    const mockEvents = [
      { eventType: "Resume Uploaded", source: "ATS Engine", pointsEarned: 5, createdAt: new Date() }
    ];

    return toAnalyticsDashboardDTO(
      mockSnapshot,
      mockConsistency,
      mockSkillTrend,
      mockAchievements,
      mockPrediction,
      mockWeekly,
      mockEvents
    );
  }
}

module.exports = {
  logCareerEvent,
  compileDashboardData
};
