const User = require("../models/User");
const LearningProgress = require("../models/LearningProgress");
const Recommendation = require("../models/Recommendation");
const { mockDb } = require("../config/mockDb");

const { computeNextBestAction } = require("../engines/nextBestAction.engine");
const { toRecommendationListDTO } = require("../dto/recommendation.dto");
const { recalculateUserStats } = require("./career.service");

// 1. Get user state helper
async function getUserState(userId) {
  try {
    const userDoc = await User.findById(userId);
    if (!userDoc) throw new Error("User not found.");

    // Check module completions
    const m1Log = await LearningProgress.findOne({ userId, subSkillId: "be-sub-4", completed: true });
    const m2Log = await LearningProgress.findOne({ userId, subSkillId: "be-sub-2", completed: true });

    return {
      hasResumeScanned: userDoc.hasResumeScanned,
      hasGithubScanned: userDoc.hasGithubScanned,
      completedM1: !!m1Log,
      completedM2: !!m2Log,
      projectsCount: userDoc.projectsCount,
      masteredQuestionsCount: userDoc.masteredQuestionsCount,
      careerScore: userDoc.score,
      jobReadiness: 78
    };
  } catch (err) {
    // Offline local fallback
    const hasM1 = mockDb.missions.find(m => m.id === "m-1")?.completed || false;
    const hasM2 = mockDb.missions.find(m => m.id === "m-2")?.completed || false;
    return {
      hasResumeScanned: mockDb.user.hasResumeScanned,
      hasGithubScanned: mockDb.user.hasGithubScanned,
      completedM1: hasM1,
      completedM2: hasM2,
      projectsCount: mockDb.user.projectsCount,
      masteredQuestionsCount: mockDb.user.masteredQuestionsCount,
      careerScore: mockDb.user.score,
      jobReadiness: 78
    };
  }
}

// 2. Fetch Ranked Recommendations
async function getRankedRecommendations(userId) {
  const userState = await getUserState(userId);
  const ranked = computeNextBestAction(userState);

  if (ranked.length === 0) return [];

  const topGenerated = ranked[0];

  try {
    const userDoc = await User.findById(userId);
    const targetRole = userDoc ? userDoc.goal : "Full Stack Developer";

    // Call Gemini API to write tailored explanations for the top recommendation
    const prompt = `Explain why the next best career action for a candidate aiming to be a "${targetRole}" is:
Action Title: "${topGenerated.title}"
Action Type: "${topGenerated.type}"
Current Career Score: ${userState.careerScore}

Output a JSON object conforming exactly to this structure:
{
  "description": "A tailored, motivating description of what the user needs to do.",
  "reason": "A highly specific, data-backed explanation of why this action is high priority for a ${targetRole} role and how it will improve their career readiness."
}`;

    const { generateGeminiContent } = require("../config/gemini");
    const geminiJson = await generateGeminiContent(prompt, "You are a professional career coach explaining recommendations. Respond only in valid JSON.", true);
    if (geminiJson) {
      try {
        const parsed = JSON.parse(geminiJson);
        topGenerated.description = parsed.description || topGenerated.description;
        topGenerated.reason = parsed.reason || topGenerated.reason;
      } catch (e) {
        console.error("Failed to parse Gemini recommendation explanation JSON:", e);
      }
    }

    // Check MongoDB for active recommendation
    const activeRec = await Recommendation.findOne({ userId, status: "Active" });

    if (!activeRec || activeRec.actionId !== topGenerated.actionId) {
      // Deactivate old active recommendations
      if (activeRec) {
        activeRec.status = "Skipped";
        await activeRec.save();
      }

      // Persist the new top priority recommendation
      const newRec = await Recommendation.create({
        userId,
        actionId: topGenerated.actionId,
        title: topGenerated.title,
        description: topGenerated.description,
        type: topGenerated.type,
        priority: topGenerated.priority,
        impactScore: topGenerated.impactScore,
        estimatedTime: topGenerated.estimatedTime,
        confidence: topGenerated.confidence,
        reason: topGenerated.reason,
        dependencies: topGenerated.dependencies,
        status: "Active"
      });

      // Update the first element of ranked list with database model properties
      ranked[0] = { ...ranked[0], status: "Active" };
    } else {
      ranked[0] = { ...ranked[0], status: "Active" };
    }
    
    return toRecommendationListDTO(ranked);
  } catch (err) {
    // Offline local fallback
    ranked[0].status = "Active";
    return toRecommendationListDTO(ranked);
  }
}

// 3. Mark recommendation as completed
async function completeRecommendation(userId, actionId) {
  try {
    const activeRec = await Recommendation.findOne({ userId, actionId, status: "Active" });
    if (activeRec) {
      activeRec.status = "Completed";
      activeRec.completedAt = new Date();
      await activeRec.save();
    }

    // Apply outcomes on user model properties
    const userDoc = await User.findById(userId);
    if (userDoc) {
      if (actionId === "action-resume-upload") userDoc.hasResumeScanned = true;
      if (actionId === "action-github-connect") userDoc.hasGithubScanned = true;
      if (actionId === "action-interview-mock") userDoc.masteredQuestionsCount += 1;
      await userDoc.save();
    }

    await recalculateUserStats(userId);
    return { success: true, message: "Recommendation resolved as completed." };
  } catch (err) {
    // Offline local fallback
    if (actionId === "action-resume-upload") mockDb.user.hasResumeScanned = true;
    if (actionId === "action-github-connect") mockDb.user.hasGithubScanned = true;
    if (actionId === "action-interview-mock") mockDb.user.masteredQuestionsCount += 1;
    return { success: true, message: "Offline recommendation resolved." };
  }
}

// 4. Mark recommendation as skipped
async function skipRecommendation(userId, actionId) {
  try {
    const activeRec = await Recommendation.findOne({ userId, actionId, status: "Active" });
    if (activeRec) {
      activeRec.status = "Skipped";
      await activeRec.save();
    }
    return { success: true, message: "Recommendation marked as skipped." };
  } catch (err) {
    return { success: true, message: "Offline recommendation marked as skipped." };
  }
}

// 5. Force recommendation regeneration
async function forceRegenerate(userId) {
  try {
    await Recommendation.updateMany({ userId, status: "Active" }, { status: "Skipped" });
    return await getRankedRecommendations(userId);
  } catch (err) {
    return await getRankedRecommendations(userId);
  }
}

module.exports = {
  getRankedRecommendations,
  completeRecommendation,
  skipRecommendation,
  forceRegenerate
};
