const User = require("../models/User");
const Resume = require("../models/Resume");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const DeveloperProfile = require("../models/DeveloperProfile");
const InterviewSession = require("../models/InterviewSession");
const CareerEvent = require("../models/CareerEvent");
const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");
const WeeklyReport = require("../models/WeeklyReport");
const Achievement = require("../models/Achievement");


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
    const score = userDoc ? userDoc.score : null;

    const resume = await Resume.findOne({ userId }).sort({ uploadDate: -1 });
    const resumeAnalysis = resume 
      ? await ResumeAnalysis.findOne({ userId, resumeId: resume._id }) 
      : null;
    const devProfile = await DeveloperProfile.findOne({ userId });
    const mockSessions = await InterviewSession.find({ userId, status: "Completed" });

    // Category scores
    const resumeScore = resumeAnalysis?.atsScore ?? null;
    const devScore = devProfile?.overallHealth ?? null;
    const portfolioScore = devProfile?.overallHealth ?? null;
    const interviewScore = mockSessions.length > 0
      ? Math.round(mockSessions.reduce((acc, curr) => acc + curr.overallScore, 0) / mockSessions.length)
      : null;

    // Load events
    const events = await CareerEvent.find({ userId }).sort({ createdAt: -1 });
    const snapshots = await AnalyticsSnapshot.find({ userId }).sort({ createdAt: -1 });

    // Execute Engines
    const growthData = calculateGrowthDeltas(score, snapshots);
    const consistencyData = compileConsistencyActivity(events);
    if (userDoc) {
      consistencyData.streakDays = userDoc.streakDays;
    }
    const skills = userDoc?.skillsPossessed || {};
    const skillTrendData = compileSkillTrend(skills);

    const userStats = {
      hasResumeScanned: !!resume,
      projectsCount: devProfile?.repositoryCount || 0
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

    const predictionData = score == null || growthData.weeklyGrowth == null
      ? null
      : projectFutureScore(score, growthData.weeklyGrowth);
    
    // Use Gemini to generate dynamic Weekly Report digest based on recent events and career context
    const { getCareerContext } = require("./careerContext.service");
    const userContext = await getCareerContext(userId);
    const recentEvents = events.slice(0, 20); // Top 20 recent events
    
    const analyticsPrompt = `Analyze the candidate's recent activity logs and overall career context to generate a Weekly Insights Report.
Target Role: "${userContext.targetRole}"
Recent Activity Events:
${JSON.stringify(recentEvents.map(e => ({ eventType: e.eventType, source: e.source, date: e.createdAt })), null, 2)}
Overall Health Score: ${devScore}

Identify patterns (e.g. if they are consistently failing interview questions, or ignoring their Roadmap, or shipping lots of code).
Output a JSON object conforming exactly to this structure:
{
  "summary": "Insightful 2-sentence summary of their week.",
  "completedTasksCount": ${events.length},
  "pointsEarned": ${score != null && snapshots[0]?.careerScore != null ? score - snapshots[0].careerScore : 0},
  "nextWeekFocus": "Specific, actionable recommendation based on their activity (e.g., 'Focus on Docker as you struggled with it in interviews')."
}`;

    const { generateAiContent } = require("../config/ai");
    let weeklyDigest = null;
    try {
      const geminiJson = await generateAiContent(analyticsPrompt, "You are a Senior Data Analyst generating a weekly progress report. Output JSON only.", true);
      if (geminiJson) {
        weeklyDigest = JSON.parse(geminiJson);
      }
    } catch (e) {
      console.error("Gemini analytics generation failed:", e);
    }

    // Save current Analytics Snapshot
    const currentSnapshot = await AnalyticsSnapshot.create({
      userId,
      careerScore: score,
      resumeScore,
      developerScore: devScore,
      projectScore: portfolioScore,
      roadmapScore: userDoc ? userDoc.roadmapProgress || 50 : 50,
      interviewScore,
      jobReadiness: resumeScore != null && devScore != null ? Math.round((resumeScore + devScore) / 2) : null,
      interviewReadiness: interviewScore,
      portfolioReadiness: portfolioScore,
      weeklyGrowth: growthData.weeklyGrowth,
      monthlyGrowth: growthData.monthlyGrowth
    });

    // Save current Weekly Report digest
    await WeeklyReport.deleteOne({ userId }); // Keep latest
    const savedWeeklyReport = weeklyDigest ? await WeeklyReport.create({
      userId,
      summary: weeklyDigest.summary,
      completedTasksCount: weeklyDigest.completedTasksCount,
      pointsEarned: weeklyDigest.pointsEarned,
      nextWeekFocus: weeklyDigest.nextWeekFocus
    }) : null;

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
    console.error("Analytics Service Error in compileDashboardData:", err);
    throw err;
  }
}

module.exports = {
  logCareerEvent,
  compileDashboardData
};
